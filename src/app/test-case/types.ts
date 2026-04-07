export type TestType = 'functional' | 'edge-case' | 'negative' | 'performance' | 'security' | 'ui-ux' | 'compatibility' | 'api'
export type TestPriority = 'critical' | 'high' | 'medium' | 'low'
export type TestStatus = 'pending' | 'passed' | 'failed' | 'skipped'
export type TestPlatform = 'web' | 'mobile' | 'api' | 'all'

export interface TestCase {
  id: string
  title: string
  type: TestType
  priority: TestPriority
  platform: TestPlatform
  precondition: string
  steps: string[]
  expectedResult: string
  status: TestStatus
}
