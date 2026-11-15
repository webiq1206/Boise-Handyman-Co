import type {HandymanPlanningData} from "./handymanPlanning.ts";
export type PlanningStep = "category" | "task" | "review" | "result";
export type PlanningState = {version: 1; step: PlanningStep; categoryId: string; taskId: string | null};
export type PlanningAction = {type: "category" | "task"; id: string} | {type: "next" | "back" | "edit-category" | "edit-task"} | {type: "restore"; state: PlanningState};
export function initialPlanningState(data: HandymanPlanningData): PlanningState {
  const category = data.categories[0];
  return {version: 1, step: "result", categoryId: category?.id || "", taskId: category?.tasks[0]?.id || null};
}
export function planningSelection(data: HandymanPlanningData, state: PlanningState) {
  const category = data.categories.find(item => item.id === state.categoryId);
  return {category, task: category?.tasks.find(item => item.id === state.taskId)};
}
export function readPlanningState(data: HandymanPlanningData, value: unknown): PlanningState {
  if (!value || typeof value !== "object") return initialPlanningState(data);
  const candidate = value as Partial<PlanningState>;
  if (candidate.version !== 1 || !["category", "task", "review", "result"].includes(candidate.step || "") || typeof candidate.categoryId !== "string") return initialPlanningState(data);
  const category = data.categories.find(item => item.id === candidate.categoryId);
  if (!category || (candidate.taskId !== null && !category.tasks.some(item => item.id === candidate.taskId))) return initialPlanningState(data);
  return {version: 1, step: candidate.step as PlanningStep, categoryId: category.id, taskId: candidate.taskId || null};
}
export function updatePlanningState(data: HandymanPlanningData, state: PlanningState, action: PlanningAction): PlanningState {
  const {category, task} = planningSelection(data, state);
  switch (action.type) {
    case "restore": return readPlanningState(data, action.state);
    case "category": return data.categories.some(item => item.id === action.id) ? {...state, categoryId: action.id, taskId: state.categoryId === action.id ? state.taskId : null} : state;
    case "task": return category?.tasks.some(item => item.id === action.id) ? {...state, taskId: action.id} : state;
    case "next": return state.step === "category" && category ? {...state, step: "task"} : state.step === "task" && task ? {...state, step: "review"} : state.step === "review" && task ? {...state, step: "result"} : state;
    case "back": return {...state, step: state.step === "result" ? "review" : state.step === "review" ? "task" : state.step === "task" ? "category" : "result"};
    case "edit-category": return {...state, step: "category"};
    case "edit-task": return {...state, step: "task"};
  }
}
