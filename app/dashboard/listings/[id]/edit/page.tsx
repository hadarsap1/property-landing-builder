import { redirect } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

export default async function EditRedirect({ params }: Props) {
  const { id } = await params
  redirect(`/builder?id=${id}`)
}
