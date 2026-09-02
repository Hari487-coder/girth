import { PrismaClient, Prisma } from '@prisma/client'

export type Db = PrismaClient
/** A client inside `prisma.$transaction`, so services compose transactionally. */
export type Tx = Prisma.TransactionClient

export function createPrisma(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  return typeof value === 'number' ? value : value.toNumber()
}
