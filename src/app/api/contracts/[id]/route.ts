import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerContract, ServerContractAuditLog, ServerContractSignature } from '@/lib/server/db'

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const db = await getServerDb()
    const list = db.contracts || []
    const contract = list.find((c) => c.id === id)

    if (!contract) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hợp đồng' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: contract,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const body = await req.json()
    const db = await getServerDb()
    if (!db.contracts) {
      db.contracts = []
    }

    const index = db.contracts.findIndex((c) => c.id === id)
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hợp đồng để cập nhật' }, { status: 404 })
    }

    const current = db.contracts[index]

    // Xử lý các loại hành động cập nhật
    const {
      status,
      startDate,
      endDate,
      customFields,
      renderedContent,
      signature,
      auditLog,
      snapshot,
      action,
      reason,
      actor,
    } = body

    const updated: ServerContract = {
      ...current,
      status: status || current.status,
      startDate: startDate || current.startDate,
      endDate: endDate !== undefined ? endDate : current.endDate,
      customFields: customFields ? { ...current.customFields, ...customFields } : current.customFields,
      renderedContent: renderedContent || current.renderedContent,
    }

    // Nếu có chữ ký mới được gửi lên (ký tay điện tử hoặc app confirm)
    if (signature) {
      const sigObj = signature as ServerContractSignature
      updated.signatures = [
        ...current.signatures.filter((s) => s.role !== sigObj.role),
        sigObj,
      ]
    }

    // Nếu có nhật ký audit log mới
    if (auditLog) {
      const logObj = auditLog as ServerContractAuditLog
      updated.auditLogs = [logObj, ...(current.auditLogs || [])]
    }

    // Nếu có snapshot mới
    if (snapshot) {
      updated.snapshotHistory = [...(current.snapshotHistory || []), snapshot]
    }

    // Xử lý chuyên biệt cho hành động thanh lý (liquidation)
    if (action === 'liquidate' || action === 'void') {
      updated.status = 'void'
      const actorName = actor?.full_name || 'Quản trị viên'
      const actorId = actor?.id || 'admin'
      const cancelLog: ServerContractAuditLog = {
        id: `log-${Date.now()}`,
        action: 'liquidate',
        actorId,
        actorName,
        at: new Date().toISOString(),
        note: `Thanh lý hợp đồng. Lý do: ${reason || 'Chấm dứt thỏa thuận lao động'}`,
      }
      updated.auditLogs = [cancelLog, ...(updated.auditLogs || [])]
      if (reason) {
        updated.customFields = {
          ...updated.customFields,
          'contract.liquidation_reason': reason,
          'contract.liquidated_at': new Date().toISOString(),
        }
      }
    }

    // Xử lý khi kích hoạt sau khi HR countersign
    if (status === 'active' && !current.activatedAt) {
      updated.activatedAt = new Date().toISOString()
    }

    db.contracts[index] = updated
    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
