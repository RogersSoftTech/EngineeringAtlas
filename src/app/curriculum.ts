import { Topic } from './models';
export const topics: Topic[] = [
  {
    "id": "t0",
    "name": "Software Architecture",
    "category": "technical",
    "icon": "◇",
    "description": "Design systems that stay understandable as they grow.",
    "modules": [
      {
        "id": "t0m0",
        "title": "Boundaries & modularity",
        "content": "Separate business capabilities before choosing deployment boundaries. A modular .NET application can enforce ownership with assemblies, internal types, and explicit contracts before introducing network calls.",
        "example": "Map an order journey into Ordering, Inventory and Billing. Identify who owns each SQL Server table.",
        "exercise": "Create a C# solution with separate domain assemblies. Write an ADR comparing a modular monolith and microservices; include deployment frequency, team ownership and operational cost.",
        "question": "A team wants one service per database table. How would you evaluate the proposal?",
        "rubric": "Discuss cohesion, transaction boundaries, independent change and the cost of distributed operations. Start from business capabilities and measure coupling.",
        "minutes": 30
      },
      {
        "id": "t0m1",
        "title": "Contracts & evolutionary design",
        "content": "Treat API schemas and events as long-lived products. Prefer additive evolution, consumer compatibility checks and explicit deprecation windows. Database migrations should allow old and new application versions to coexist.",
        "example": "An OrderPlaced Kafka event gains a currency field while older consumers remain deployed.",
        "exercise": "Design an expand-and-contract SQL Server migration and version-tolerant C# event record. Describe rollback after the new producer ships.",
        "question": "How do you evolve a contract used by ten teams?",
        "rubric": "Inventory consumers, test compatibility, add fields safely, publish a migration plan and observe adoption before removal.",
        "minutes": 45
      },
      {
        "id": "t0m2",
        "title": "Architecture decisions & quality attributes",
        "content": "Quality attributes turn broad goals into testable scenarios. Document context, options, consequences and reversal cost in an ADR. Review architecture against latency, recovery and changeability goals.",
        "example": "A platform API needs p95 latency under 200 ms and recovery within 30 minutes.",
        "exercise": "Write an ADR comparing synchronous calls and asynchronous processing; add a load-test plan, recovery objective and a diagram of failure boundaries.",
        "question": "How do you prove an architecture is good enough?",
        "rubric": "Use measurable quality scenarios, representative workloads and failure tests. State uncertainty and the evidence needed to revisit a decision.",
        "minutes": 60
      }
    ]
  },
  {
    "id": "t1",
    "name": "Distributed Systems",
    "category": "technical",
    "icon": "⌘",
    "description": "Build confidence in failure, consistency and scale.",
    "modules": [
      {
        "id": "t1m0",
        "title": "Consistency & transactions",
        "content": "A distributed workflow can commit locally while downstream work is delayed. Model business invariants explicitly and choose where strong consistency is necessary. Eventual consistency needs visible intermediate states and reconciliation.",
        "example": "Ordering commits to SQL Server while Inventory consumes an event later.",
        "exercise": "Implement a transactional outbox in C#: save the order and event in one SQL transaction, relay to Kafka, and make the consumer idempotent using an event ID.",
        "question": "How would you avoid losing events between SQL Server and Kafka?",
        "rubric": "Explain the dual-write failure, atomic outbox, relay retries, deduplication and why delivery is generally at least once.",
        "minutes": 30
      },
      {
        "id": "t1m1",
        "title": "Resilience & backpressure",
        "content": "Timeouts bound waiting; retries can multiply load. Use bounded retries with jitter, cancellation, concurrency limits and queues with finite capacity. A circuit breaker protects a struggling dependency.",
        "example": "A Redis outage causes every API request to fall back to SQL Server.",
        "exercise": "Run an outage experiment. Define a cache fallback budget, bound SQL concurrency, propagate CancellationToken and compare p95 latency with and without retry limits.",
        "question": "A downstream dependency slows down. What happens next?",
        "rubric": "Trace resource exhaustion, retry amplification and queue growth. Prioritize deadlines, load shedding, bounded concurrency and recovery signals.",
        "minutes": 45
      },
      {
        "id": "t1m2",
        "title": "Streams & delivery semantics",
        "content": "Kafka orders records within a partition. Choose keys from the ordering requirement, and plan consumer rebalances, poison-message handling and replay. Broker guarantees do not automatically make external side effects exactly once.",
        "example": "Order events use OrderId as a key; a consumer updates a SQL projection.",
        "exercise": "Build an idempotent projection consumer, stop it between database commit and offset commit, then replay. Record lag, duplicates and recovery behavior.",
        "question": "How do you scale an ordered event consumer?",
        "rubric": "Explain partition-level ordering, key skew, partition count, consumer groups and state migration tradeoffs.",
        "minutes": 60
      }
    ]
  },
  {
    "id": "t2",
    "name": "Platform Engineering",
    "category": "technical",
    "icon": "▧",
    "description": "Create paved roads that make developers more effective.",
    "modules": [
      {
        "id": "t2m0",
        "title": "Platform as a product",
        "content": "A platform serves internal customers. Discover repeated friction and offer a small supported path with clear ownership. Adoption and time saved are better signals than the number of tools shipped.",
        "example": "Teams repeatedly configure .NET services, GitHub Actions and telemetry from scratch.",
        "exercise": "Interview three hypothetical service teams. Design a service template with health checks, ownership metadata, CI and observability; define an adoption and lead-time metric.",
        "question": "How do you avoid building a platform nobody uses?",
        "rubric": "Start with user pain, test an optional thin slice, measure adoption and friction, and maintain a feedback loop.",
        "minutes": 30
      },
      {
        "id": "t2m1",
        "title": "Delivery & golden paths",
        "content": "A golden path should offer safe defaults and escape hatches. Use repeatable infrastructure, least-privilege workload identities and versioned templates. Promote the same artifact across environments.",
        "example": "A new C# API needs a container, secrets, deployment and dashboards.",
        "exercise": "Sketch a GitHub Actions workflow that builds once, scans, tests, and promotes an image digest with environment approval and rollback.",
        "question": "What belongs in a shared delivery platform?",
        "rubric": "Centralize repeatable guardrails while keeping service ownership local. Explain versioning, support, exceptions and rollout.",
        "minutes": 45
      },
      {
        "id": "t2m2",
        "title": "Reliability & developer productivity",
        "content": "Platform reliability is a product feature. Define service objectives and measure user journeys such as creating or deploying a service. Combine delivery metrics with developer feedback rather than ranking individuals.",
        "example": "A slow CI fleet adds 15 minutes to each pull request.",
        "exercise": "Map CI wait time, execution time and flaky-test retries. Propose one experiment and a baseline; define an SLO for successful deployments.",
        "question": "How would you measure platform impact?",
        "rubric": "Connect reliability and workflow time to developer outcomes; combine quantitative trends with interviews and avoid individual productivity scores.",
        "minutes": 60
      }
    ]
  },
  {
    "id": "t3",
    "name": "Docker",
    "category": "technical",
    "icon": "▣",
    "description": "Package .NET services into repeatable, secure artifacts.",
    "modules": [
      {
        "id": "t3m0",
        "title": "Images & build layers",
        "content": "Multi-stage builds separate compilation from runtime. Cache dependency restore separately from source changes. Keep secrets out of build arguments and image layers. Pin supported base images and refresh them deliberately.",
        "example": "A .NET 10 API image includes the SDK and unnecessary source files.",
        "exercise": "Write a multi-stage Dockerfile using the .NET SDK for build and ASP.NET runtime for execution. Copy project files before restore and inspect the final image contents.",
        "question": "How would you reduce image size and build time?",
        "rubric": "Discuss multi-stage builds, layer ordering, build context, cache reuse and measurable before/after results.",
        "minutes": 30
      },
      {
        "id": "t3m1",
        "title": "Runtime & local composition",
        "content": "Containers have isolated process and network contexts. Use service DNS names instead of localhost for dependencies. Treat readiness, startup ordering and durable volumes as separate concerns.",
        "example": "An API connects to SQL Server and Redis in a development stack.",
        "exercise": "Create a Compose design with API, Redis and SQL Server, health checks and a persistent SQL volume. Restart dependencies and verify reconnect behavior.",
        "question": "Why can a container fail to connect to localhost?",
        "rubric": "Explain the container network namespace and distinguish host ports from inter-container service discovery.",
        "minutes": 45
      },
      {
        "id": "t3m2",
        "title": "Security & operations",
        "content": "Run with minimal privileges, immutable image references and external configuration. Resource limits and graceful shutdown matter under load. Scan artifacts and plan rebuilds when base-image fixes arrive.",
        "example": "A container receives SIGTERM during an in-flight order request.",
        "exercise": "Run the API with a non-root user and resource limits. Test shutdown cancellation and inspect whether a partial operation can be retried safely.",
        "question": "What makes a container production ready?",
        "rubric": "Cover runtime identity, image provenance, secrets, health, resource limits, shutdown and observability.",
        "minutes": 60
      }
    ]
  },
  {
    "id": "t4",
    "name": "Kubernetes",
    "category": "technical",
    "icon": "⎈",
    "description": "Operate services with deliberate reliability controls.",
    "modules": [
      {
        "id": "t4m0",
        "title": "Workloads & service discovery",
        "content": "Deployments manage replicated pods; Services provide stable discovery. Startup, readiness and liveness probes serve different purposes. A dependency outage should not automatically trigger restart loops.",
        "example": "Three replicas of a .NET API serve traffic through a Service.",
        "exercise": "Design Deployment and Service manifests. Define separate health endpoints and demonstrate that an unready pod stops receiving new traffic.",
        "question": "How would you diagnose a pod that is running but not serving?",
        "rubric": "Inspect readiness, endpoints, selectors, ports, logs, events and networking before changing replicas.",
        "minutes": 30
      },
      {
        "id": "t4m1",
        "title": "Resources & safe delivery",
        "content": "Requests inform scheduling; limits constrain resource use. Autoscaling depends on useful signals and adequate cluster capacity. Rolling updates need readiness, termination time and disruption budgets that match capacity.",
        "example": "Traffic spikes while a new API version is rolling out.",
        "exercise": "Estimate CPU and memory from load tests, define an HPA signal, and plan rollout settings with enough spare capacity and a rollback trigger.",
        "question": "Why can autoscaling fail to solve latency?",
        "rubric": "Discuss bottlenecks, signal delay, cold start, cluster capacity and downstream saturation.",
        "minutes": 45
      },
      {
        "id": "t4m2",
        "title": "Operations & recovery",
        "content": "Debug from user symptoms through service telemetry to pod and node evidence. Use ownership, runbooks and tested recovery paths. Managed Kubernetes still requires workload security and application reliability work.",
        "example": "Kafka consumer lag rises after a node drain.",
        "exercise": "Write a runbook linking lag, rebalance logs, pod scheduling and partition skew. Compare AKS and EKS identity and operational responsibilities.",
        "question": "How would you prepare a Kubernetes service for a zone failure?",
        "rubric": "Discuss placement, capacity, disruption, stateful dependencies, objectives and an exercised recovery plan.",
        "minutes": 60
      }
    ]
  },
  {
    "id": "t5",
    "name": "AI-Assisted Engineering",
    "category": "technical",
    "icon": "✧",
    "description": "Use AI with evidence, boundaries and human judgment.",
    "modules": [
      {
        "id": "t5m0",
        "title": "Context & task framing",
        "content": "AI output improves when the task includes constraints, relevant code, expected behavior and acceptance criteria. Keep proprietary secrets out of prompts and use approved data handling rules.",
        "example": "An assistant helps refactor a C# service without changing its public contract.",
        "exercise": "Write a task brief with examples, invariants and tests. Ask for a small patch; inspect every changed line and record where the suggestion was incorrect.",
        "question": "How do you use AI without reducing code quality?",
        "rubric": "Describe bounded tasks, review, executable validation, data handling and ownership of the final result.",
        "minutes": 30
      },
      {
        "id": "t5m1",
        "title": "Verification & evaluation",
        "content": "Plausible output is not evidence. Validate behavior, dependency claims and security assumptions independently. Use representative evaluation cases and compare against an unaided baseline.",
        "example": "An assistant generates SQL Server queries and repository code.",
        "exercise": "Prepare five normal and five adversarial cases, including nulls, authorization boundaries and injection attempts. Evaluate correctness and review time.",
        "question": "How would you evaluate an AI coding pilot?",
        "rubric": "Use real tasks, quality and security outcomes, total review effort, failure categories and a controlled baseline.",
        "minutes": 45
      },
      {
        "id": "t5m2",
        "title": "Team workflows & governance",
        "content": "AI adoption changes review, documentation and support work. Set transparent expectations about permitted data and verification. Share failures and useful patterns; keep accountable owners for production changes.",
        "example": "A platform team wants AI-generated GitHub Actions workflows.",
        "exercise": "Draft a lightweight policy and review checklist. Pilot workflow generation with secret permissions, pinned dependencies and a rollback plan.",
        "question": "How do you roll out AI across an engineering organization?",
        "rubric": "Begin with a measured pilot, clear policy, training, feedback and staged expansion based on evidence.",
        "minutes": 60
      }
    ]
  },
  {
    "id": "t6",
    "name": "Engineering Leadership",
    "category": "leadership",
    "icon": "↗",
    "description": "Connect technical choices to people and outcomes.",
    "modules": [
      {
        "id": "t6m0",
        "title": "Technical strategy",
        "content": "A technical strategy links business outcomes, current constraints and a small set of deliberate bets. Make tradeoffs explicit and identify what the organization will stop doing.",
        "example": "Microservice delivery is slowing as shared dependencies increase.",
        "exercise": "Write a one-page strategy with diagnosis, three guiding principles and a 90-day experiment. Include operational and delivery measures.",
        "question": "Tell me about a technical strategy you shaped.",
        "rubric": "Use context, competing options, your decision, stakeholder alignment and measured results; distinguish your contribution.",
        "minutes": 30
      },
      {
        "id": "t6m1",
        "title": "Delegation & ownership",
        "content": "Delegate outcomes and decision boundaries, not just tasks. Match support to experience and risk. Agree on checkpoints without taking decisions back at the first sign of ambiguity.",
        "example": "A senior engineer owns a Redis migration across teams.",
        "exercise": "Write a delegation brief covering outcome, constraints, decisions, escalation triggers and review cadence.",
        "question": "How do you delegate a high-risk initiative?",
        "rubric": "Explain readiness, decision rights, guardrails, coaching and checkpoints proportional to risk.",
        "minutes": 45
      },
      {
        "id": "t6m2",
        "title": "Decision systems",
        "content": "Leadership scales through clear decision mechanisms. Distinguish reversible choices from consequential commitments and assign an accountable decision owner. Preserve dissent and revisit decisions using agreed signals.",
        "example": "Teams disagree over adopting Kubernetes for all workloads.",
        "exercise": "Run a decision review with options, evidence, dissent and a deadline. Publish an ADR and explicit conditions for revisiting it.",
        "question": "How do you lead a decision when experts disagree?",
        "rubric": "Clarify goals and decision rights, compare evidence, surface uncertainty, decide and evaluate outcomes.",
        "minutes": 60
      }
    ]
  },
  {
    "id": "t7",
    "name": "Team & People Leadership",
    "category": "leadership",
    "icon": "♧",
    "description": "Build trust, ownership and sustainable team growth.",
    "modules": [
      {
        "id": "t7m0",
        "title": "Coaching & one-to-ones",
        "content": "Use one-to-ones to understand context and support growth. Ask open questions, distinguish coaching from directing, and agree on a small next action with follow-up.",
        "example": "An engineer is repeatedly blocked by ambiguous platform requirements.",
        "exercise": "Draft a one-to-one agenda and five coaching questions. Agree on an experiment that gives the engineer more agency.",
        "question": "How do you help an engineer who is struggling?",
        "rubric": "Diagnose expectations, skills, environment and support; agree on specific actions and revisit evidence.",
        "minutes": 30
      },
      {
        "id": "t7m1",
        "title": "Growth & career development",
        "content": "Career growth needs observable expectations and opportunities to practice. Separate promotion evidence from general praise. Avoid assigning only maintenance work to people who need broader scope.",
        "example": "A strong C# developer wants to move toward staff-level influence.",
        "exercise": "Create a development plan with a cross-team design review, mentorship and measurable evidence of impact over a quarter.",
        "question": "How do you grow senior engineers?",
        "rubric": "Connect aspirations and strengths to stretch opportunities, sponsorship, feedback and observable outcomes.",
        "minutes": 45
      },
      {
        "id": "t7m2",
        "title": "Team health & inclusion",
        "content": "Psychological safety supports speaking up, while accountability sets clear commitments. Look for uneven participation, hidden work and unsustainable load. Change team systems before attributing every problem to individuals.",
        "example": "On-call interruptions repeatedly fall on two experienced engineers.",
        "exercise": "Map interrupt load, introduce paired runbook sessions and rotate supported on-call responsibilities. Define a health check after four weeks.",
        "question": "How do you build a high-performing team?",
        "rubric": "Discuss clarity, trust, inclusive participation, feedback, ownership and sustainable delivery using concrete evidence.",
        "minutes": 60
      }
    ]
  },
  {
    "id": "t8",
    "name": "Collaboration & Communication",
    "category": "leadership",
    "icon": "◌",
    "description": "Make complex ideas clear and shared work easier.",
    "modules": [
      {
        "id": "t8m0",
        "title": "Writing for decisions",
        "content": "Lead with the decision needed and why it matters. Adapt technical detail to the audience. Document alternatives, cost, uncertainty and a clear request.",
        "example": "Finance and engineering need to approve an observability investment.",
        "exercise": "Write a 300-word proposal linking incident recovery time to customer impact, options and a specific decision.",
        "question": "How do you explain technical debt to executives?",
        "rubric": "Translate the issue into risk, cost or missed opportunity; give options and a measurable investment case.",
        "minutes": 30
      },
      {
        "id": "t8m1",
        "title": "Cross-team collaboration",
        "content": "Collaboration improves when dependencies, ownership and response expectations are visible. Co-design interfaces early and avoid surprising downstream teams with finished decisions.",
        "example": "An identity API change affects five .NET service teams.",
        "exercise": "Create a dependency map, compatibility plan, stakeholder review and migration communication with named owners.",
        "question": "Describe a difficult cross-team collaboration.",
        "rubric": "Show how you clarified shared outcomes, listened to constraints, negotiated commitments and followed through.",
        "minutes": 45
      },
      {
        "id": "t8m2",
        "title": "Conflict & difficult conversations",
        "content": "Separate observations from interpretations. Ask for the other perspective and anchor disagreement in shared goals. End with explicit commitments and a follow-up point.",
        "example": "A product partner sees reliability work as a delay tactic.",
        "exercise": "Write an opening statement using observed incident impact, ask about product pressures, and propose two options with tradeoffs.",
        "question": "How do you handle conflict with a peer?",
        "rubric": "Use a concrete example of listening, shared goals, evidence, agreement and what changed afterward.",
        "minutes": 60
      }
    ]
  },
  {
    "id": "t9",
    "name": "Influence Without Authority",
    "category": "leadership",
    "icon": "⇄",
    "description": "Earn alignment through trust and useful evidence.",
    "modules": [
      {
        "id": "t9m0",
        "title": "Stakeholder mapping",
        "content": "Influence starts with understanding incentives and constraints. Map decision owners, affected teams and informal experts. Build relationships before asking for organizational change.",
        "example": "You want teams to adopt a shared GitHub Actions template.",
        "exercise": "Map five stakeholder roles, their likely concerns and evidence each would need. Plan listening conversations before pitching.",
        "question": "How do you get buy-in without formal authority?",
        "rubric": "Understand incentives, co-create a proposal, demonstrate value and make adoption easier.",
        "minutes": 30
      },
      {
        "id": "t9m1",
        "title": "Evidence & pilots",
        "content": "A small reversible pilot can resolve uncertainty better than a broad mandate. Define success and stop criteria before starting, and share costs alongside benefits.",
        "example": "Teams doubt that a platform service will improve deployment speed.",
        "exercise": "Design a two-team pilot measuring deployment effort, reliability and support load; include an opt-out and feedback plan.",
        "question": "Tell me about influencing a skeptical team.",
        "rubric": "Explain their concern, the evidence you gathered, adaptations you made and the resulting behavior change.",
        "minutes": 45
      },
      {
        "id": "t9m2",
        "title": "Coalitions & sustained adoption",
        "content": "Lasting influence requires local champions and continued support. Make shared wins visible, document migration paths and avoid treating initial agreement as completed adoption.",
        "example": "A new observability standard has support but little usage.",
        "exercise": "Build a champion network, office hours and an adoption dashboard. Identify one friction point and remove it.",
        "question": "What do you do when people agree but do not act?",
        "rubric": "Explore competing priorities and practical barriers, lower adoption cost and negotiate concrete commitments.",
        "minutes": 60
      }
    ]
  },
  {
    "id": "t10",
    "name": "Organizational Leadership",
    "category": "leadership",
    "icon": "⌂",
    "description": "Shape systems that help multiple teams succeed.",
    "modules": [
      {
        "id": "t10m0",
        "title": "Operating models & ownership",
        "content": "Team boundaries shape communication and architecture. Assign clear service ownership and account for cognitive load, dependencies and support. Organization design is a hypothesis to evaluate.",
        "example": "A platform group has become the bottleneck for every infrastructure change.",
        "exercise": "Compare a ticket-driven model and self-service model. Define team interfaces, escalation paths and what remains centrally owned.",
        "question": "How would you redesign an engineering organization?",
        "rubric": "Start from outcomes and constraints, inspect dependencies and load, pilot changes and measure effects.",
        "minutes": 30
      },
      {
        "id": "t10m1",
        "title": "Strategy & portfolio choices",
        "content": "Organizational strategy requires resource tradeoffs. Balance product investment, reliability and capability development using transparent criteria. Keep fewer initiatives active and make opportunity cost visible.",
        "example": "Leadership proposes six migrations while product commitments remain fixed.",
        "exercise": "Create a ranked portfolio using value, risk reduction, capacity and sequencing. Explain two initiatives you would defer.",
        "question": "How do you prioritize across teams?",
        "rubric": "Show common criteria, capacity constraints, dependencies, stakeholder negotiation and deliberate deferral.",
        "minutes": 45
      },
      {
        "id": "t10m2",
        "title": "Change & culture",
        "content": "Culture is reinforced by everyday incentives and leadership behavior. Explain why change is needed, involve affected people and create feedback channels. Measure behavior and outcomes rather than announcement reach.",
        "example": "Incident reviews produce blame and little follow-through.",
        "exercise": "Design a learning review format with contributing factors, system improvements, owners and a 30-day action review.",
        "question": "How have you changed engineering culture?",
        "rubric": "Describe specific behaviors, structural changes, reinforcement and evidence that the change persisted.",
        "minutes": 60
      }
    ]
  },
  {
    "id": "t11",
    "name": "Execution & Delivery",
    "category": "leadership",
    "icon": "✓",
    "description": "Turn uncertainty into dependable, visible progress.",
    "modules": [
      {
        "id": "t11m0",
        "title": "Planning & decomposition",
        "content": "Break outcomes into thin slices that produce feedback. Separate assumptions from commitments and expose dependencies early. Estimates should reflect uncertainty and evolve with evidence.",
        "example": "A migration from a shared database to service-owned storage spans three teams.",
        "exercise": "Create milestones that preserve compatibility and deliver incremental value. Identify the highest-risk assumption and test it first.",
        "question": "How do you plan a complex delivery?",
        "rubric": "Use outcomes, thin slices, dependency management, uncertainty ranges and explicit feedback points.",
        "minutes": 30
      },
      {
        "id": "t11m1",
        "title": "Flow & risk management",
        "content": "Limit work in progress and monitor aging work. Delivery risk often accumulates in queues, handoffs and unresolved decisions. Escalate with options and consequences early.",
        "example": "A release is waiting on security review and an external API contract.",
        "exercise": "Build a risk register with likelihood, impact, owner and trigger. Propose scope reduction and sequencing options for a fixed date.",
        "question": "A project is slipping. What do you do?",
        "rubric": "Reassess facts, surface constraints, propose scope/time/capacity options and communicate an evidence-based plan.",
        "minutes": 45
      },
      {
        "id": "t11m2",
        "title": "Outcomes & continuous improvement",
        "content": "Shipping is an output; successful adoption and reliable operation are outcomes. Review both delivery flow and user impact. Improve one bottleneck at a time and check for unintended effects.",
        "example": "A new developer portal ships but service creation still takes two days.",
        "exercise": "Instrument the full service-creation journey, interview users, and design a four-week improvement experiment.",
        "question": "How do you know a delivery was successful?",
        "rubric": "Compare intended outcomes with adoption, quality and operational evidence; explain learning and follow-up.",
        "minutes": 60
      }
    ]
  },
  {
    "id": "t12",
    "name": "Feedback & Performance Reviews",
    "category": "leadership",
    "icon": "☷",
    "description": "Make feedback specific, fair and actionable.",
    "modules": [
      {
        "id": "t12m0",
        "title": "Timely & actionable feedback",
        "content": "Give feedback close to the event using specific behavior and impact. Ask for context and agree on a concrete change. Keep the conversation about observable work rather than personality.",
        "example": "A senior engineer dismisses questions during architecture reviews.",
        "exercise": "Draft a private conversation naming the behavior and its effect on participation. Ask for their perspective and agree on a review habit.",
        "question": "How do you deliver difficult feedback?",
        "rubric": "Use observed examples, listen, clarify expectations and agree on measurable follow-up.",
        "minutes": 30
      },
      {
        "id": "t12m1",
        "title": "Evidence & calibration",
        "content": "Evaluate impact against clear role expectations using evidence across the review period. Seek multiple perspectives and check recency, visibility and attribution bias. Do not surprise someone at review time.",
        "example": "A quiet engineer stabilizes SQL Server operations while a visible project gets most attention.",
        "exercise": "Create an evidence log covering outcomes, collaboration and scope. Draft a balanced review and identify missing context before calibration.",
        "question": "How do you make performance reviews fair?",
        "rubric": "Discuss clear standards, ongoing feedback, representative evidence, calibration and bias checks.",
        "minutes": 45
      },
      {
        "id": "t12m2",
        "title": "Growth & accountability",
        "content": "Separate developmental support from vague reassurance. Set explicit expectations, provide resources and review progress regularly. For formal processes, follow organizational policy and involve the appropriate people partner.",
        "example": "Repeated missed commitments continue after informal feedback.",
        "exercise": "Write a support plan with observable expectations, checkpoints, resources and a fair opportunity to respond.",
        "question": "How do you handle persistent underperformance?",
        "rubric": "Clarify the gap, understand causes, offer targeted support, document evidence and follow policy with consistent treatment.",
        "minutes": 60
      }
    ]
  }
];
export const cloud: string[][] = [
  [
    "Compute",
    "App Service / Azure Container Apps / AKS",
    "App Runner / ECS on Fargate / EKS"
  ],
  [
    "Relational data",
    "Azure SQL Database",
    "Amazon RDS for SQL Server"
  ],
  [
    "Events",
    "Event Hubs (Kafka endpoint) / managed Kafka partner",
    "Amazon MSK"
  ],
  [
    "Caching",
    "Azure Managed Redis",
    "Amazon ElastiCache"
  ],
  [
    "Telemetry",
    "Azure Monitor / Application Insights",
    "Amazon CloudWatch / X-Ray"
  ],
  [
    "Workload identity",
    "Microsoft Entra workload identity",
    "EKS Pod Identity / IAM roles"
  ]
];
