INSERT INTO riomind_tools
(name, description, ai_layer, permission_scope, schema, enabled, metadata)
VALUES
(
  'riomind_meeting_graph_query',
  'Query Nexus Teams meeting intelligence from the RioMind Knowledge Graph.',
  'shared',
  'read',
  '{
    "type":"object",
    "required":["meetingCode"],
    "properties":{
      "meetingCode":{"type":"string"},
      "question":{"type":"string"}
    }
  }'::jsonb,
  true,
  '{"category":"knowledge_graph","surfaces":["nexus","nexus_teams","core_ai"],"verification":"required","readOnly":true}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  permission_scope = EXCLUDED.permission_scope,
  schema = EXCLUDED.schema,
  enabled = true,
  metadata = EXCLUDED.metadata,
  updated_at = now();
