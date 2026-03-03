import { z } from 'zod';

export const GrantSchema = z.object({
  title:         z.string().min(1),
  fundingAgency: z.string().optional(),
  amount:        z.number().nonnegative().optional(),
  status:        z.string().optional(),
  startDate:     z.string().optional(),
  endDate:       z.string().optional(),
  description:   z.string().optional(),
  worktag:       z.string().optional(),
});

export const BudgetSchema = z.object({
  grantId:     z.string().min(1),
  totalBudget: z.number().nonnegative(),
  categories:  z.array(z.object({
    name:      z.string().min(1),
    allocated: z.number().nonnegative().optional(),
    miniPools: z.array(z.object({
      description: z.string().min(1),
      allocated:   z.number().nonnegative().optional(),
    })).optional(),
  })).optional(),
});

export const MeetingSchema = z.object({
  title:     z.string().min(1),
  date:      z.string().min(1),
  location:  z.string().optional(),
  attendees: z.string().optional(),
  notes:     z.string().optional(),
  grantId:   z.string().optional(),
});

export const TaskSchema = z.object({
  title:       z.string().min(1),
  status:      z.enum(['To Do', 'In Progress', 'Review', 'Done']).optional(),
  priority:    z.enum(['low', 'medium', 'high']).optional(),
  description: z.string().optional(),
  dueDate:     z.string().optional(),
  assignee:    z.string().optional(),
  grantId:     z.string().optional(),
});

export const StudentSchema = z.object({
  name:            z.string().min(1),
  status:          z.enum(['Active', 'Discontinued']).optional(),
  day:             z.string().optional(),
  time:            z.string().optional(),
  location:        z.string().optional(),
  sessions:        z.number().optional(),
  experienceLevel: z.string().optional(),
});

export const TodoSchema = z.object({
  text:      z.string().min(1),
  completed: z.boolean().optional(),
  priority:  z.enum(['high', 'medium', 'normal']).optional(),
  dueDate:   z.string().optional(),
});

// Helper: log validation errors without throwing (non-breaking)
export const validateSafe = (schema, data, label = 'data') => {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn(`[Schema] Validation failed for ${label}:`, result.error.issues);
    return false;
  }
  return true;
};
