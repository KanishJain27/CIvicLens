import type {
  ComplaintCategory,
  Department,
} from "@/types/complaint";

/**
 * Static mapping from each supported complaint category to the municipal
 * department responsible for resolving it. Used by the AI service and the
 * complaint service to route tickets automatically.
 */
export const CATEGORY_TO_DEPARTMENT: Readonly<
  Record<ComplaintCategory, Department>
> = {
  "Roads and potholes": "Roads and Engineering",
  "Waste management": "Solid Waste Management",
  "Water supply and leakage": "Water Supply Department",
  "Electricity and streetlights": "Electrical Department",
  "Trees and fallen branches": "Parks and Horticulture",
  "Drainage and sewage": "Stormwater and Drainage",
  Other: "Municipal General Complaints",
};

/**
 * Return the department responsible for a complaint category.
 *
 * @param category one of the supported `ComplaintCategory` values.
 * @returns the `Department` that owns resolution, falling back to
 *          `Municipal General Complaints` for unknown values.
 */
export function routeDepartment(category: ComplaintCategory): Department {
  return CATEGORY_TO_DEPARTMENT[category] ?? "Municipal General Complaints";
}
