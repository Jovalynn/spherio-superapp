export async function getRIOHistory() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_INDEXER}/rio/history`,
    { cache: "no-store" }
  );

  if (!res.ok) return [];

  return res.json();
}
