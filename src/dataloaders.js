import DataLoader from 'dataloader';

export function createLoaders(prisma) {
  const companyById = new DataLoader(async (ids) => {
    console.log(`[dataloader] batching ${ids.length} company loads into 1 query`);
    const companies = await prisma.company.findMany({
      where: { id: { in: [...new Set(ids)] } },
    });
    const byId = new Map(companies.map((c) => [c.id, c]));
    return ids.map((id) => byId.get(id) ?? null); 
  });

  return { companyById };
}
