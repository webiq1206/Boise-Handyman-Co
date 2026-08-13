/**
 * The wire schema for a handyman estimate submitted from the calculator.
 *
 * This lives here, once, so /api/estimate-lead and the client can never
 * disagree about the shape. The server treats the client's numbers as a
 * cross-check only: it recomputes the range from the tasks with
 * calculateHandymanEstimate and quotes its own result.
 *
 * The exhaustiveness checks below make it a compile error, not a runtime
 * surprise, to add a category, size, materials plan or urgency level to the
 * engine without accepting it over the wire.
 */
import { z } from "zod";
import {
  JOB_CATEGORY_IDS,
  MATERIALS_PLAN_VALUES,
  MAX_TASK_QUANTITY,
  OTHER_JOB_SIZE_VALUES,
  URGENCY_LEVEL_VALUES,
  type JobCategoryId,
  type MaterialsPlan,
  type OtherJobSize,
  type UrgencyLevel,
} from "./estimateEngine";

export const jobCategorySchema = z.enum(JOB_CATEGORY_IDS);
export const otherJobSizeSchema = z.enum(OTHER_JOB_SIZE_VALUES);
export const materialsPlanSchema = z.enum(MATERIALS_PLAN_VALUES);
export const urgencyLevelSchema = z.enum(URGENCY_LEVEL_VALUES);

/* Fails to compile if the engine grows a value these enums do not accept. */
type MissingCategory = Exclude<JobCategoryId, z.infer<typeof jobCategorySchema>>;
const _allCategoriesCovered: MissingCategory extends never ? true : never = true;
type MissingSize = Exclude<OtherJobSize, z.infer<typeof otherJobSizeSchema>>;
const _allSizesCovered: MissingSize extends never ? true : never = true;
type MissingMaterials = Exclude<MaterialsPlan, z.infer<typeof materialsPlanSchema>>;
const _allMaterialsCovered: MissingMaterials extends never ? true : never = true;
type MissingUrgency = Exclude<UrgencyLevel, z.infer<typeof urgencyLevelSchema>>;
const _allUrgencyCovered: MissingUrgency extends never ? true : never = true;

/**
 * One picked task. taskId is validated for existence server-side (unknown ids
 * are ignored by the engine rather than 400ing, so a stale client after a
 * catalog rename still submits).
 */
export const taskSelectionSchema = z.object({
  taskId: z.string().min(1).max(60),
  quantity: z.number().int().min(1).max(MAX_TASK_QUANTITY),
});

/** The estimate object the handyman calculator submits. */
export const handymanEstimateSchema = z.object({
  category: jobCategorySchema,
  tasks: z.array(taskSelectionSchema).max(30),
  otherJob: z
    .object({
      description: z.string().max(600),
      size: otherJobSizeSchema,
    })
    .nullable()
    .optional(),
  materials: materialsPlanSchema,
  urgency: urgencyLevelSchema,
  /* What the visitor was shown. The server recomputes and logs a mismatch
     instead of trusting these. */
  priceLow: z.number().nonnegative().max(1_000_000),
  priceHigh: z.number().nonnegative().max(1_000_000),
  laborHours: z.number().nonnegative().max(500),
});

export type HandymanEstimatePayload = z.infer<typeof handymanEstimateSchema>;

// Referenced so the exhaustiveness constants are not dropped as unused.
void _allCategoriesCovered;
void _allSizesCovered;
void _allMaterialsCovered;
void _allUrgencyCovered;

/* ───────────────────────────────────────────────── legacy construction wire */

/*
 * LEGACY re-exports: server/services/assistant/tools.ts and
 * app/api/consultation still validate the construction-era estimate shape.
 * The names are unchanged so those modules keep compiling; the handyman
 * estimator itself never uses them. Remove with shared/legacy once those
 * consumers are converted.
 */
export {
  PROJECT_TYPE_VALUES,
  FINISH_LEVEL_VALUES,
  projectTypeSchema,
  finishLevelSchema,
  refinementsSchema,
  estimateSchema,
  type EstimatePayload,
} from "./legacy/constructionEstimatePayload";
