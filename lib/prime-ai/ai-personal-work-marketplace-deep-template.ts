import type { DeepNicheTemplate } from "./deep-niche-template";

export const AI_PERSONAL_WORK_MARKETPLACE_DEEP_TEMPLATE: DeepNicheTemplate = {
  id: "ai_personal_work_marketplace",
  title: "AI Personal & Work Marketplace Intelligence Platform",
  publicPositioning:
    "A creator-owned productivity and work marketplace for personal admin, professional workflows, task agents, templates, service requests, work assistants, life organization, and automation packages.",
  creatorPromise:
    "Prime lets a creator launch a productivity marketplace, work assistant hub, personal admin platform, professional-service marketplace, template store, or AI workflow marketplace without building the full stack from scratch.",
  userPromise:
    "Users can organize work, plan tasks, request services, use productivity agents, generate templates, manage personal admin, track priorities, and produce structured work-output packages.",
  audiences: [
    { title: "Professionals and workers", description: "Plan work, prioritize tasks, prepare meetings, generate reports, and automate routine workflows." },
    { title: "Freelancers and service providers", description: "Package services, sell templates, offer task support, and manage client workflows." },
    { title: "Busy individuals and families", description: "Organize personal admin, schedules, errands, documents, reminders, and life-management tasks." },
    { title: "Teams and operators", description: "Coordinate tasks, assign workflows, track deliverables, and generate operating reports." },
  ],
  creatorSetup: [
    { title: "Marketplace focus", description: "The creator chooses the productivity or work category.", options: ["Personal admin", "Professional services", "Task agents", "Templates", "Freelance workflows", "Team productivity", "Life management"] },
    { title: "Workflow type", description: "The creator chooses the core work utility.", options: ["Task planning", "Calendar prep", "Meeting assistant", "Document assistant", "Service matching", "Template marketplace", "Productivity coaching"] },
    { title: "User model", description: "The creator chooses who the marketplace serves.", options: ["Individuals", "Professionals", "Freelancers", "Families", "Small teams", "Companies", "Agencies"] },
    { title: "Access and monetization", description: "The creator decides how users access productivity utilities.", options: ["Free", "Subscription", "Usage credits", "Service fee", "Template purchase", "RIO/RUSD", "USDT/USDC", "Card payments later"] },
  ],
  userWorkflow: [
    { step: "01", title: "Enter personal or work goal", description: "User describes the task, project, service need, schedule, document, or productivity problem." },
    { step: "02", title: "Structure priorities", description: "The runtime identifies urgency, importance, dependencies, blockers, timeline, and required outputs." },
    { step: "03", title: "Match workflow or service", description: "The app recommends productivity agent, template, service provider, checklist, or automation path." },
    { step: "04", title: "Generate work plan", description: "The system creates tasks, timeline, checklist, draft output, delegation plan, and follow-up actions." },
    { step: "05", title: "Track execution", description: "The runtime tracks completion, blockers, next actions, reminders, review points, and deliverables." },
    { step: "06", title: "Generate productivity report", description: "The app outputs work plan, service match, task package, priority map, and next-action report." },
  ],
  deepModules: [
    { title: "Task and Priority Mapper", purpose: "Convert goals into tasks, priorities, urgency, dependencies, blockers, and timelines.", outputs: ["task_map", "priority_matrix", "dependency_list"] },
    { title: "Work Plan Generator", purpose: "Create execution plans, milestones, checklists, and deliverable schedules.", outputs: ["work_plan", "milestone_schedule", "execution_checklist"] },
    { title: "Personal Admin Router", purpose: "Organize personal admin, documents, reminders, errands, forms, and follow-up actions.", outputs: ["admin_plan", "document_checklist", "reminder_plan"] },
    { title: "Service Matching Engine", purpose: "Match user needs to professional services, freelancer tasks, templates, or marketplace packages.", outputs: ["service_matches", "match_reasoning", "purchase_recommendation"] },
    { title: "Template and Workflow Builder", purpose: "Generate reusable templates, checklists, scripts, forms, SOPs, and productivity workflows.", outputs: ["template_package", "workflow_steps", "usage_notes"] },
    { title: "Meeting and Communication Assistant", purpose: "Prepare agendas, notes, follow-ups, email drafts, summaries, and decision logs.", outputs: ["meeting_agenda", "followup_draft", "decision_log"] },
    { title: "Productivity Analytics Engine", purpose: "Analyze workload, delay, completion risk, focus areas, and productivity bottlenecks.", outputs: ["productivity_report", "blocker_flags", "focus_recommendations"] },
    { title: "Work Output Package Generator", purpose: "Produce a complete productivity package with plan, templates, service match, and next actions.", outputs: ["output_package", "review_points", "next_actions"] },
  ],
  accessModels: [
    { title: "Public productivity assistant", description: "Anyone can generate basic task plans, checklists, and templates." },
    { title: "Subscription productivity workspace", description: "Users pay for saved workspaces, advanced planning, templates, reports, and personal admin." },
    { title: "Usage-credit work marketplace", description: "Users spend credits, RIO, RUSD, USDT, or USDC for advanced workflows and service packages." },
    { title: "Team and service-provider workspace", description: "Teams and providers manage projects, clients, tasks, deliverables, templates, and service orders." },
  ],
  rioMindNexusRole: [
    "Act as the productivity and work orchestration layer behind AI Personal & Work Marketplace.",
    "Structure goals, tasks, priorities, dependencies, blockers, timelines, and required outputs.",
    "Match users to templates, services, productivity agents, assistants, and workflow packages.",
    "Generate work plans, personal admin routes, meeting assets, task packages, and productivity reports.",
    "Support future service marketplace, subscriptions, usage credits, work memory, and workflow automation.",
    "Generate work-output reports with assumptions, limitations, review points, and next-action recommendations.",
  ],
  proofAndVerification: [
    "Generated work plans and templates should be reviewed before professional use.",
    "Legal, financial, medical, HR, tax, and high-impact work requires qualified human review.",
    "The system must not guarantee job outcomes, productivity results, client acquisition, or income.",
    "Marketplace services require transparent scope, pricing, delivery terms, and dispute/quality rules.",
  ],
};
