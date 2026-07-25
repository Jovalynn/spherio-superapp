export type MeetingSourceType = "chat" | "transcript";

export type MeetingDetectionType =
  | "decision"
  | "action"
  | "risk"
  | "question"
  | "commitment";

export type MeetingDetectionInput = {
  meetingCode: string;
  sourceType: MeetingSourceType;
  sourceId: string;
  sourceText: string;
  speaker?: string;
  participantId?: string;
  language?: string;
  createdAt?: string;
};

export type MeetingDetection = {
  id: string;
  type: MeetingDetectionType;
  title: string;
  detail: string;
  speaker?: string;
  owner?: string;
  due?: string;
  confidence: number;
  status: "detected";
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  meetingId: string;
  participantId?: string;
  sourceType: MeetingSourceType;
  sourceId: string;
  sourceText: string;
  detectedBy: "rules";
  tags: string[];
};

function stableId(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

function cleanSentence(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[\s:;,\-.]+|[\s:;,\-.]+$/g, "")
    .trim();
}

function titleFromText(text: string, fallback: string) {
  const cleaned = cleanSentence(text);

  if (!cleaned) return fallback;
  if (cleaned.length <= 72) return cleaned;

  return `${cleaned.slice(0, 69).trim()}…`;
}

function detectDueDate(text: string) {
  const patterns = [
    /\b(today|tomorrow|tonight)\b/i,
    /\b(next\s+(?:week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
    /\b(?:by|before|on)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(?:by|before|on)\s+(\d{1,2}(?:st|nd|rd|th)?\s+[a-z]+\s+\d{4})\b/i,
    /\b(?:by|before|on)\s+([a-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return undefined;
}

function isCasualFutureStatement(text: string) {
  const casualPatterns = [
    /\b(?:i'll|i will)\s+(?:see|meet|call|talk to|visit)\s+(?:you|him|her|them)\b/i,
    /\b(?:i'll|i will)\s+(?:give|bring|take|find|buy|get)\s+(?:my|a|the)\s+(?:friend|drink|thing|gift|food)\b/i,
    /\b(?:i'll|i will)\s+(?:be|feel|look|stay|sleep|eat|drink|go|come)\b/i,
    /\bsee you\s+(?:later|soon|tomorrow|in a little bit)\b/i,
    /\bgod bless\b/i,
    /\byou(?:'re| are)\s+(?:beautiful|kind|nice|amazing|wonderful)\b/i,
    /\bmy favorite\b/i,
  ];

  return casualPatterns.some((pattern) => pattern.test(text));
}

function hasActionableTaskContext(text: string) {
  const taskObjectPattern =
    /\b(?:report|document|proposal|contract|deployment|release|migration|integration|testing|test|review|analysis|design|implementation|database|api|code|configuration|credentials|invoice|presentation|agenda|minutes|summary|follow[- ]?up|task|action item|deliverable|approval|sign[- ]?off|issue|ticket|project|workspace|meeting)\b/i;

  const strongTaskVerbPattern =
    /\b(?:prepare|complete|finish|review|submit|deliver|send|publish|deploy|implement|configure|create|update|fix|resolve|investigate|verify|approve|schedule|draft|document|test|migrate|assign|provide|share|attach|finalize)\b/i;

  const explicitAssignmentPattern =
    /\b(?:action item|assigned to|responsible for|owner\s*:|must|needs? to|should)\b/i;

  return (
    explicitAssignmentPattern.test(text) ||
    (
      strongTaskVerbPattern.test(text) &&
      taskObjectPattern.test(text)
    )
  );
}

function detectOwner(text: string, speaker?: string) {
  const namedOwnerPatterns = [
    /\b([A-Z][a-z]+)\s+(?:will|shall|should|must|can|is going to)\b/,
    /\bassign(?:ed)?\s+(?:this\s+)?to\s+([A-Z][a-z]+)\b/i,
    /\bowner\s*:\s*([A-Z][a-z]+)\b/i,
    /\bresponsible\s+(?:person\s+)?(?:is|will be)\s+([A-Z][a-z]+)\b/i,
  ];

  for (const pattern of namedOwnerPatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  if (
    /\b(I will|I'll|I shall|I can|I am going to|I'm going to)\b/i.test(text)
  ) {
    return speaker;
  }

  return undefined;
}

function createDetection(
  input: MeetingDetectionInput,
  type: MeetingDetectionType,
  title: string,
  detail: string,
  confidence: number,
  extras?: {
    owner?: string;
    due?: string;
    tags?: string[];
  }
): MeetingDetection {
  const now = new Date().toISOString();

  return {
    id: `${type}-${stableId(
      `${input.meetingCode}:${input.sourceType}:${input.sourceId}:${title}`
    )}`,
    type,
    title,
    detail,
    speaker: input.speaker,
    owner: extras?.owner,
    due: extras?.due,
    confidence,
    status: "detected",
    createdAt: input.createdAt || now,
    updatedAt: now,
    meetingId: input.meetingCode,
    participantId: input.participantId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    sourceText: input.sourceText,
    detectedBy: "rules",
    tags: extras?.tags || [],
  };
}

export function detectMeetingIntelligence(
  input: MeetingDetectionInput
): MeetingDetection[] {
  const text = cleanSentence(input.sourceText);

  if (!text || text.length < 4) return [];
  if (input.speaker === "Nexus AI") return [];

  const results: MeetingDetection[] = [];
  const due = detectDueDate(text);
  const owner = detectOwner(text, input.speaker);

  const decisionPattern =
    /\b(?:we decided|we have decided|decision(?:\s+is)?|we agreed|it is agreed|let's proceed|we will use|we'll use|we are going with|final decision|approved that)\b/i;

  if (decisionPattern.test(text)) {
    const detail = cleanSentence(
      text.replace(decisionPattern, "").replace(/^that\b/i, "")
    );

    results.push(
      createDetection(
        input,
        "decision",
        titleFromText(detail || text, "Meeting decision"),
        text,
        93,
        { tags: ["decision"] }
      )
    );
  }

  const commitmentPattern =
    /\b(?:I promise|I commit|we commit|I can take this|I'll handle|I will handle|we'll deliver|I will send|I'll send|I will prepare|I'll prepare|I will complete|I'll complete|I will finish|I'll finish)\b/i;

  const explicitActionPattern =
    /\b(?:action item|assigned to|is responsible for|owner\s*:|must complete|must prepare|needs? to|should prepare|should complete|should review|will prepare|will complete|will finish|will review|will submit|will deliver|will implement|will fix|will verify|will approve)\b/i;

  const casualFutureStatement =
    isCasualFutureStatement(text);

  const actionableContext =
    hasActionableTaskContext(text);

  const commitmentDetected =
    commitmentPattern.test(text) &&
    actionableContext &&
    !casualFutureStatement;

  const explicitActionDetected =
    explicitActionPattern.test(text) &&
    actionableContext &&
    !casualFutureStatement;

  /*
   * A commitment is represented as one canonical action record with
   * commitment metadata. It must not produce both a commitment card
   * and a duplicate action card.
   */
  if (
    (commitmentDetected || explicitActionDetected) &&
    !decisionPattern.test(text)
  ) {
    results.push(
      createDetection(
        input,
        "action",
        titleFromText(text, "Meeting action item"),
        text,
        commitmentDetected ? 94 : owner ? 92 : 86,
        {
          owner:
            owner ||
            (commitmentDetected ? input.speaker : undefined),
          due,
          tags: [
            "action",
            ...(commitmentDetected
              ? ["commitment"]
              : []),
            ...(due ? ["deadline"] : []),
            ...(owner || commitmentDetected
              ? ["owner"]
              : []),
          ],
        }
      )
    );
  }

  const riskPattern =
    /\b(?:risk|blocked|blocker|blocking|may delay|might delay|could delay|cannot continue|can't continue|waiting for|dependency|issue|problem|concern|failure|unavailable|missing credentials)\b/i;

  if (riskPattern.test(text)) {
    results.push(
      createDetection(
        input,
        "risk",
        titleFromText(text, "Meeting risk or blocker"),
        text,
        91,
        {
          tags: ["risk", "blocker"],
        }
      )
    );
  }

  const explicitQuestionPattern =
    /\?$|\b(?:who will|who should|who owns|how do we|how should we|when will|when can|what should|what is the decision|why is this blocked|should we|can we approve|could we decide|where do we)\b/i;

  const meetingQuestionContext =
    /\b(?:decision|decide|approve|approval|owner|responsible|action item|deadline|due|risk|blocker|blocked|dependency|resolve|clarify|clarification|scope|requirement|launch|release|deployment|migration|report|proposal|project|meeting|pilot|provider|translation|recording|policy|participant|customer|budget|timeline|next step|follow[- ]?up)\b/i;

  const casualQuestionPattern =
    /\b(?:how are you|can you hear me|are you there|what do you mean|is that okay|really|you know)\b/i;

  if (
    explicitQuestionPattern.test(text) &&
    meetingQuestionContext.test(text) &&
    !casualQuestionPattern.test(text)
  ) {
    results.push(
      createDetection(
        input,
        "question",
        titleFromText(text, "Open meeting question"),
        text,
        89,
        {
          tags: ["question", "unresolved"],
        }
      )
    );
  }

  const priority: Record<MeetingDetectionType, number> = {
    decision: 1,
    action: 2,
    risk: 3,
    question: 4,
    commitment: 5,
  };

  return results
    .filter(
      (result, index, collection) =>
        collection.findIndex(
          (candidate) =>
            candidate.type === result.type &&
            cleanSentence(candidate.title).toLowerCase() ===
              cleanSentence(result.title).toLowerCase()
        ) === index
    )
    .sort(
      (left, right) =>
        priority[left.type] - priority[right.type]
    )
    .slice(0, 3);
}
