UPDATE iq_tests
SET sequence_definition = '{
  "version": 1,
  "longMemory": {
    "enabled": true,
    "introTitle": "Memoire longue",
    "introText": "Nous allons en particulier tester votre memoire longue.",
    "flushPendingBeforeSpeed": true,
    "items": [
      {
        "questionKey": "long-memory-001",
        "displayTimeSeconds": 8,
        "minDelaySeconds": 20
      },
      {
        "questionKey": "long-memory-002",
        "displayTimeSeconds": 8,
        "minDelaySeconds": 20
      }
    ]
  },
  "steps": [
    {
      "type": "question",
      "choices": [
        { "questionKey": "verbal-001", "weight": 30 },
        { "questionKey": "verbal-002", "weight": 40 },
        { "questionKey": "verbal-003", "weight": 30 }
      ]
    },
    { "type": "question", "questionKey": "quantitative-001" },
    {
      "type": "memory",
      "questionKeys": ["memory-001", "memory-002", "memory-003"]
    },
    {
      "type": "speed",
      "questionKeys": ["speed-001", "speed-004", "speed-010"],
      "timeLimitSeconds": 20
    }
  ]
}'
WHERE slug = 'test-qi-complet';
