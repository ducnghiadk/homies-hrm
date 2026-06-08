import Link from 'next/link'

export function TrialTrackingEmptyState({ variant }: { variant: 'no_employees' | 'no_results' | 'missing_setup' }) {
  const content = variant === 'missing_setup'
    ? {
        title: 'Ch\u01b0a th\u1ec3 theo d\u00f5i v\u00ec c\u00f2n thi\u1ebfu thi\u1ebft l\u1eadp',
        body: 'Ho\u00e0n t\u1ea5t map ch\u1ee9c danh, template v\u00e0 b\u01b0\u1edbc n\u1ec1n t\u1ea3ng tr\u01b0\u1edbc khi theo d\u00f5i th\u1eed vi\u1ec7c.',
        href: '/career-path/onboarding/setup',
        cta: '\u0110i t\u1edbi thi\u1ebft l\u1eadp quy tr\u00ecnh th\u1eed vi\u1ec7c',
      }
    : variant === 'no_results'
      ? {
          title: 'Kh\u00f4ng c\u00f3 nh\u00e2n s\u1ef1 trong b\u1ed9 l\u1ecdc n\u00e0y',
          body: '\u0110\u1ed5i b\u1ed9 l\u1ecdc \u0111\u1ec3 xem nh\u00f3m kh\u00e1c ho\u1eb7c quay l\u1ea1i to\u00e0n b\u1ed9 danh s\u00e1ch.',
          href: '/career-path/onboarding?filter=all',
          cta: 'Xem to\u00e0n b\u1ed9 danh s\u00e1ch',
        }
      : {
          title: 'Ch\u01b0a c\u00f3 nh\u00e2n s\u1ef1 n\u00e0o \u0111\u1ec3 theo d\u00f5i',
          body: 'Khi c\u00f3 nh\u00e2n s\u1ef1 m\u1edbi v\u00e0o v\u00f9ng th\u1eed vi\u1ec7c, danh s\u00e1ch s\u1ebd hi\u1ec7n t\u1ea1i \u0111\u00e2y.',
          href: '/career-path/onboarding/setup',
          cta: 'M\u1edf thi\u1ebft l\u1eadp quy tr\u00ecnh th\u1eed vi\u1ec7c',
        }

  return (
    <div style={{ borderRadius: 24, border: '1px dashed rgba(0, 29, 61, 0.18)', background: '#FFFFFF', padding: 28, textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#001D3D' }}>{content.title}</div>
      <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6, color: '#5F6B7A' }}>{content.body}</div>
      <div style={{ marginTop: 18 }}>
        <Link href={content.href} style={{ display: 'inline-flex', borderRadius: 999, background: '#2F6FA8', color: '#FFFFFF', textDecoration: 'none', padding: '10px 14px', fontSize: 12, fontWeight: 700 }}>
          {content.cta}
        </Link>
      </div>
    </div>
  )
}
