import Container from "@/components/common/Container";
import Link from "next/link";

export default function NotFound() {
  return (
    <Container className="py-20 text-center">
      <p className="font-display text-6xl font-bold">404</p>
      <p className="mt-4 text-muted-foreground">Хуудас олдсонгүй.</p>
      <Link href="/" className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">
        Нүүр хуудас
      </Link>
    </Container>
  );
}
