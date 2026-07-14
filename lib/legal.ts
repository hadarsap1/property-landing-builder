// Central place for legal/compliance details shown on the privacy policy,
// accessibility statement, and consent texts.
//
// TODO(hadar): replace the placeholder business name and coordinator name
// with the real legal entity + accessibility coordinator before launch.

export const LEGAL = {
  /** Legal name of the operating business, shown in policies. */
  businessName: 'Property Landing Builder (PropBuilder)',
  /** Contact for privacy requests and the accessibility coordinator. */
  contactEmail: 'hadarsap@gmail.com',
  /** רכז/ת הנגישות — חובה שם + דרך קשר אנושית (תקן 5568). */
  accessibilityCoordinator: 'הדר ספיר',
  /**
   * Bump when the privacy policy meaningfully changes. Stored on every lead
   * as evidence of which policy version the visitor approved.
   */
  privacyPolicyVersion: '2026-07-14',
} as const
