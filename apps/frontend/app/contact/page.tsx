import ContactPage from "@/components/pages/contact/contactPage";

export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ ong?: string | string[] }>;
}) {
  const { ong } = await searchParams;
  const ongName = Array.isArray(ong) ? ong[0] : ong;
  return <ContactPage ongName={ongName} />;
}
