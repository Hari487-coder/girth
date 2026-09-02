import { z } from 'zod'
import { TREE_STATUSES } from './treeStatus.js'

/** Request/response contracts shared by the API and its clients. */

export const USER_ROLES = ['ADMIN', 'FIELD_AUDITOR', 'FARMER', 'CUSTOMER', 'ORGANISATION'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const OCCASIONS = [
  'BIRTH',
  'WEDDING',
  'BIRTHDAY',
  'MEMORIAL',
  'HOUSEWARMING',
  'COMMITMENT',
] as const
export type Occasion = (typeof OCCASIONS)[number]

const latitude = z.coerce.number().min(-90).max(90)
const longitude = z.coerce.number().min(-180).max(180)
const optionalLatLng = {
  latitude: latitude.optional().nullable(),
  longitude: longitude.optional().nullable(),
}

export const LoginSchema = z.object({
  identifier: z.string().trim().min(3).max(200),
  password: z.string().min(8).max(200),
})

export const CreateUserSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(6).max(20).optional(),
  password: z.string().min(8).max(200),
  role: z.enum(USER_ROLES),
  organisationId: z.string().uuid().optional(),
}).refine((u) => u.email || u.phone, { message: 'An email or phone number is required' })

export const CreateOrganisationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  organisationType: z.enum(['NGO', 'CSR', 'FOUNDATION', 'COMPANY', 'GOVERNMENT', 'OTHER']),
  registrationDetails: z.string().trim().max(500).optional(),
  contactName: z.string().trim().max(120).optional(),
  contactEmail: z.string().trim().email().optional(),
  contactPhone: z.string().trim().max(20).optional(),
})

export const CreateProgramSchema = z.object({
  organisationId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

export const CreateFarmerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  legalName: z.string().trim().min(1).max(160).optional(),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().optional(),
  password: z.string().min(8).max(200),
  village: z.string().trim().min(1).max(120),
  district: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  preferredLanguage: z.enum(['en', 'te']).default('en'),
})

export const CreateLandPlotSchema = z.object({
  farmerId: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  locationLabel: z.string().trim().min(1).max(200),
  ...optionalLatLng,
  ownershipStatus: z.enum(['OWNED', 'LEASED', 'COMMUNITY', 'UNKNOWN']).default('UNKNOWN'),
})

export const CreateClusterSchema = z.object({
  name: z.string().trim().min(1).max(160),
  locationLabel: z.string().trim().min(1).max(200),
  organisationId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
  landPlotId: z.string().uuid().optional(),
  ...optionalLatLng,
})

export const CreateTreeSchema = z.object({
  clusterId: z.string().uuid().optional(),
  farmerId: z.string().uuid().optional(),
  organisationId: z.string().uuid().optional(),
  landPlotId: z.string().uuid().optional(),
  species: z.string().trim().min(1).max(80),
  variety: z.string().trim().max(80).optional(),
  plantingDate: z.coerce.date().optional(),
  ...optionalLatLng,
  status: z.enum(['PLANNED', 'PLANTED']).default('PLANTED'),
  ownershipStatus: z.enum(['FARMER', 'ORGANISATION', 'SHARED']).default('FARMER'),
  tagCode: z.string().trim().max(64).optional(),
  replacementForTreeId: z.string().uuid().optional(),
})

export const ChangeTreeStatusSchema = z.object({
  status: z.enum(TREE_STATUSES),
  reason: z.string().trim().min(3).max(500),
})

export const AttachTagSchema = z.object({
  tagCode: z.string().trim().min(1).max(64),
  reason: z.string().trim().max(300).optional(),
})

/** Multipart fields arrive as strings; coerce everything. */
export const SubmitMeasurementSchema = z.object({
  measurementDate: z.coerce.date(),
  measurementHeightCm: z.coerce.number().int().min(1).max(400),
  girthCm: z.coerce.number().min(0.1).max(999),
  ...optionalLatLng,
  deviceMetadata: z.string().max(2000).optional(),
  clientSubmissionId: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
})

export const ReviewMeasurementSchema = z.object({
  decision: z.enum(['VERIFIED', 'FLAGGED', 'REMEASURE_REQUIRED']),
  notes: z.string().trim().max(1000).optional(),
})

export const RecordAuditResultSchema = z.object({
  observedGirthCm: z.coerce.number().min(0).max(999).optional(),
  observedStatus: z.enum(TREE_STATUSES).optional(),
  ...optionalLatLng,
  fraudSuspected: z.boolean().default(false),
  notes: z.string().trim().max(2000).optional(),
})

export const PaymentConfigSchema = z.object({
  name: z.string().trim().min(2).max(120),
  currency: z.string().length(3).default('INR'),
  basePaise: z.coerce.number().int().min(0).default(0),
  survivalPaise: z.coerce.number().int().min(0),
  growthBonusPaise: z.coerce.number().int().min(0),
  minGrowthCmForBonus: z.coerce.number().min(0).default(1),
  deadPaise: z.coerce.number().int().min(0).default(0),
  penaltyPaise: z.coerce.number().int().min(0).default(0),
  replacementRule: z.string().trim().max(500).default('Replacement tree is registered as a new tree linked to the original.'),
  reason: z.string().trim().min(3).max(500),
})

export const MarkPaidSchema = z.object({
  externalPaymentId: z.string().trim().min(1).max(120),
  paidAt: z.coerce.date().optional(),
  reason: z.string().trim().max(500).optional(),
})

export const CreateSponsorshipSchema = z.object({
  treeName: z.string().trim().min(1).max(80),
  message: z.string().trim().max(240).optional(),
  occasion: z.enum(OCCASIONS),
  planType: z.enum(['ONE_TIME', 'PREPAID_MULTI_YEAR', 'ORGANISATION', 'GIFT']).default('PREPAID_MULTI_YEAR'),
  termYears: z.coerce.number().int().min(1).max(20).default(5),
})

export const UpdateSettingSchema = z.object({
  value: z.string().max(2000),
  reason: z.string().trim().min(3).max(500),
})

export const ExperimentSchema = z.object({
  code: z.string().trim().min(2).max(20),
  hypothesis: z.string().trim().min(5).max(500),
  assumption: z.string().trim().max(500).optional(),
  targetAudience: z.string().trim().max(200).optional(),
  experiment: z.string().trim().min(5).max(1000),
  metric: z.string().trim().min(2).max(200),
  target: z.string().trim().max(200).optional(),
  result: z.string().trim().max(1000).optional(),
  status: z.enum(['PLANNED', 'RUNNING', 'LEARNING', 'DECIDED']).default('PLANNED'),
  learning: z.string().trim().max(2000).optional(),
  decision: z.enum(['PERSEVERE', 'PIVOT', 'STOP']).optional(),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type CreateTreeInput = z.infer<typeof CreateTreeSchema>
export type SubmitMeasurementInput = z.infer<typeof SubmitMeasurementSchema>
export type ReviewMeasurementInput = z.infer<typeof ReviewMeasurementSchema>
export type RecordAuditResultInput = z.infer<typeof RecordAuditResultSchema>
export type PaymentConfigInputDto = z.infer<typeof PaymentConfigSchema>
export type CreateSponsorshipInput = z.infer<typeof CreateSponsorshipSchema>
