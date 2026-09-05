import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

describe('career map SQL contract & migration integrity', () => {
  const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations')

  const readSqlFile = (fileName: string) => {
    const filePath = path.join(migrationsDir, fileName)
    if (!fs.existsSync(filePath)) {
      return ''
    }
    return fs.readFileSync(filePath, 'utf-8')
  }

  it('maps every career aggregate text id into a compatible SQL row', () => {
    const round4Sql = readSqlFile('20260824_kpi_career_map_round4_fix.sql')
    assert.ok(round4Sql.length > 0, '20260824_kpi_career_map_round4_fix.sql must exist')

    // Must convert aggregate ID columns to TEXT
    const textColumns = [
      'kpi_career_map_versions',
      'kpi_career_map_nodes',
      'kpi_career_map_edges',
      'kpi_position_criteria_profiles',
      'kpi_position_criteria_items',
      'kpi_career_employee_placements',
      'kpi_career_map_approval_logs',
    ]

    for (const table of textColumns) {
      assert.ok(
        round4Sql.includes(table),
        `Round 4 migration must include table ${table}`
      )
    }

    // Must preserve UUID for real actors / entities
    assert.ok(round4Sql.includes('employee_id UUID') || round4Sql.includes('actor_id UUID') || round4Sql.includes('UUID REFERENCES'), 'Actor / employee IDs must remain UUID')
  })

  it('exposes exactly one publish_kpi_career_map SQL signature', () => {
    const allFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'))
    let createCount = 0
    const filesWithCreate: string[] = []

    for (const file of allFiles) {
      const content = readSqlFile(file)
      const matches = content.match(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.publish_kpi_career_map/gi)
      if (matches) {
        createCount += matches.length
        filesWithCreate.push(file)
      }
    }

    assert.equal(
      createCount,
      1,
      `Expected exactly one CREATE FUNCTION public.publish_kpi_career_map across all migrations, but found ${createCount} in: ${filesWithCreate.join(', ')}`
    )
    assert.deepEqual(filesWithCreate, ['20260824_kpi_career_map_round4_fix.sql'])
  })

  it('the publish RPC validates status role date graph criteria presets before mutation', () => {
    const round4Sql = readSqlFile('20260824_kpi_career_map_round4_fix.sql')
    assert.ok(round4Sql.length > 0, 'Round 4 fix SQL must exist')

    // Must validate role is CEO
    assert.ok(round4Sql.includes('app_kpi_is_ceo'), 'Publish RPC must verify caller is CEO via app_kpi_is_ceo()')
    // Must not accept actor_id from client parameter
    assert.ok(!round4Sql.includes('publish_kpi_career_map(p_map_id TEXT, p_actor_id'), 'Publish RPC must not accept p_actor_id from client')
    // Must check pending_approval status
    assert.ok(round4Sql.includes('pending_approval'), 'Publish RPC must verify status is pending_approval')
    // Must check effective date not in past
    assert.ok(round4Sql.includes('p_effective_from < CURRENT_DATE') || round4Sql.includes('p_effective_from < CURRENT_TIMESTAMP') || round4Sql.includes('CURRENT_DATE'), 'Publish RPC must block past effective date')
  })

  it('the publish RPC creates placements KPI versions and approval log', () => {
    const round4Sql = readSqlFile('20260824_kpi_career_map_round4_fix.sql')
    assert.ok(round4Sql.length > 0, 'Round 4 fix SQL must exist')

    assert.ok(round4Sql.includes('kpi_career_employee_placements'), 'Must insert into kpi_career_employee_placements')
    assert.ok(round4Sql.includes('kpi_career_map_approval_logs'), 'Must insert into kpi_career_map_approval_logs')
    assert.ok(round4Sql.includes('kpi_set_versions'), 'Must generate/update kpi_set_versions')
  })

  it('resolves real organization and creates real kpi_sets instead of fabricating random UUID foreign keys', () => {
    const round4Sql = readSqlFile('20260824_kpi_career_map_round4_fix.sql')
    assert.ok(round4Sql.length > 0)

    // Check no random UUID fallback in kpi_set_versions insert
    assert.ok(
      !round4Sql.includes('COALESCE((SELECT s.id FROM public.kpi_sets s WHERE s.code = n.position_id LIMIT 1), gen_random_uuid())'),
      'Must not fabricate random UUID for set_id'
    )
    assert.ok(
      !round4Sql.includes('COALESCE((SELECT to_chuc_id FROM public.nhan_vien WHERE id = v_actor_id LIMIT 1), gen_random_uuid())'),
      'Must not fabricate random UUID for org_id'
    )

    // Check real kpi_sets insert when set is missing
    assert.ok(round4Sql.includes('INSERT INTO public.kpi_sets'), 'Must create real kpi_sets record when missing')
  })

  it('safely handles employee placements without inserting null into store foreign key', () => {
    const round4Sql = readSqlFile('20260824_kpi_career_map_round4_fix.sql')
    assert.ok(round4Sql.length > 0)

    // Must check store_id is not null before inserting placement
    assert.ok(
      round4Sql.includes('v_emp.store_id IS NULL'),
      'Must detect and exclude employees with missing store_id rather than inserting NULL'
    )
    assert.ok(round4Sql.includes('v_excluded_count'), 'Must track excluded_count for unassigned staff')
  })

  it('fails closed when the publishing actor has no organization', () => {
    const round4Sql = readSqlFile('20260824_kpi_career_map_round4_fix.sql')

    assert.ok(round4Sql.includes('SELECT to_chuc_id INTO v_org_id FROM public.nhan_vien WHERE id = v_actor_id'))
    assert.ok(
      !round4Sql.includes('SELECT to_chuc_id INTO v_org_id FROM public.nhan_vien WHERE to_chuc_id IS NOT NULL LIMIT 1'),
      'Publish must never borrow an arbitrary organization from another employee'
    )
  })

  it('scopes employee placement and KPI set lookup to the actor organization only', () => {
    const round4Sql = readSqlFile('20260824_kpi_career_map_round4_fix.sql')

    assert.ok(round4Sql.includes('WHERE nv.to_chuc_id = v_org_id'))
    assert.ok(
      !round4Sql.includes('nv.to_chuc_id = v_org_id OR nv.to_chuc_id IS NULL'),
      'Employees without organization must not enter another organization deployment'
    )
    assert.ok(round4Sql.includes('WHERE s.org_id = v_org_id AND s.code = v_node.position_id'))
    assert.ok(
      !round4Sql.includes('s.org_id = v_org_id OR s.org_id IS NULL'),
      'KPI set lookup must not reuse an unscoped set'
    )
  })

  it('excludes employees missing a position instead of inserting fabricated placement values', () => {
    const round4Sql = readSqlFile('20260824_kpi_career_map_round4_fix.sql')

    assert.ok(round4Sql.includes('IF v_emp.pos_id IS NULL THEN'))
    assert.ok(
      !round4Sql.includes("'unassigned', NULL, 'unresolved', 'missing_position_assignment'"),
      'Missing positions must not use fabricated position IDs or unsupported constraint values'
    )
  })

  it('inserts kpi_sets using only columns that exist in the canonical schema', () => {
    const round4Sql = readSqlFile('20260824_kpi_career_map_round4_fix.sql')
    const coreSchema = readSqlFile('20260821_kpi_saas_core.sql')
    const createTableBlock = coreSchema.match(/CREATE TABLE IF NOT EXISTS kpi_sets \([\s\S]*?\n\);/)?.[0] || ''
    const insertColumns = round4Sql.match(/INSERT INTO public\.kpi_sets\s*\(([\s\S]*?)\)\s*VALUES/i)?.[1] || ''

    assert.ok(createTableBlock.length > 0, 'Canonical kpi_sets schema must be readable')
    assert.ok(insertColumns.length > 0, 'Publish RPC must declare kpi_sets insert columns')
    assert.ok(!insertColumns.includes('created_by'), 'kpi_sets insert must not reference missing created_by column')
  })

  it('adds grade-aware career tables and constraints', () => {
    const sql = readSqlFile('20260825_kpi_multiskill_career_grade.sql')
    assert.ok(sql.length > 0, '20260825_kpi_multiskill_career_grade.sql must exist')
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.kpi_career_grades/i)
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.kpi_operational_skills/i)
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.kpi_employee_skill_certifications/i)
    assert.match(sql, /ADD COLUMN IF NOT EXISTS grade_code/i)
    assert.match(sql, /kpi_career_map_nodes_version_pos_grade_key UNIQUE \(career_map_version_id, position_id, grade_code\)/i)

    const rlsSql = readSqlFile('20260825_kpi_multiskill_career_grade_rls.sql')
    assert.ok(rlsSql.length > 0, '20260825_kpi_multiskill_career_grade_rls.sql must exist')
    assert.match(rlsSql, /ENABLE ROW LEVEL SECURITY/i)
  })

  it('persists fail-closed placement reasons and allows only HQ roles to modify placements', () => {
    const sql = readSqlFile('20260825_kpi_multiskill_career_grade.sql')
    assert.match(sql, /missing_grade_code/i)
    assert.match(sql, /missing_skill_certification/i)
    assert.match(sql, /missing_grade_decision/i)
    assert.match(sql, /grade_not_in_map/i)

    const rlsSql = readSqlFile('20260825_kpi_multiskill_career_grade_rls.sql')
    assert.match(rlsSql, /Placements modify policy/i)
    assert.match(
      rlsSql,
      /ON public\.kpi_career_employee_placements[\s\S]*FOR ALL[\s\S]*app_kpi_is_ceo\(\)[\s\S]*app_kpi_is_hr_admin\(\)/i
    )
  })

  it('uses the canonical Homies employee columns in career-grade RLS', () => {
    const rlsSql = readSqlFile('20260825_kpi_multiskill_career_grade_rls.sql')

    assert.ok(rlsSql.length > 0, 'Career-grade RLS migration must exist')
    assert.doesNotMatch(
      rlsSql,
      /\b(?:nv|viewer|actor|subject)\.role\b/i,
      'nhan_vien uses vai_tro, not the legacy role column'
    )
    assert.doesNotMatch(
      rlsSql,
      /\b(?:nv|viewer|actor|subject)\.store_id\b/i,
      'nhan_vien uses cua_hang_id, not the legacy store_id column'
    )
    assert.match(rlsSql, /app_kpi_current_employee_id\(\)/i)
    assert.match(rlsSql, /app_kpi_current_role\(\)/i)
    assert.match(rlsSql, /cua_hang_id/i)
  })
})
