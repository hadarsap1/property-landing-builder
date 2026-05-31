import { PLAN_TRIAL_DAYS } from '@/lib/billing/config'
import RegisterForm from './_register-form'

export default function RegisterPage() {
  return <RegisterForm trialDays={PLAN_TRIAL_DAYS} />
}
