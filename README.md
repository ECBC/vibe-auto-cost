# 🚀 Hackathon Project:

# 🚗 Vibe-Auto-Cost: Lifetime Vehicle Cost Estimator

## 🎯 Business Value & Use Case
Predicting the Total Cost of Ownership (TCO) for a vehicle is a major pain point for consumers and fleet managers alike. Hidden fees, unexpected maintenance schedules, and variable depreciation rates make purchasing decisions highly unpredictable. 

**Vibe-Auto-Cost** solves this by delivering an intelligent, interactive **Lifetime Vehicle Cost Estimator**. 
* **The UX Solution:** To lower the friction of manual data entry, we ingest and clone the advanced vehicle selector component from a premium industry leader (`autodoc.es`), tailoring it specifically for a rapid and familiar user onboarding experience.
* **The AI Core:** Powered by **AdaL**, the engine maps vehicle models to historical maintenance databases, predicting real-time lifecycle expenses (fuel/battery degradation, part replacements, insurance brackets, and depreciation) based on user driving habits.

---

## 🛠️ AdaL Docker Workflow (End-to-End)

The project leverages a fully isolated Dockerized development environment running the **AdaL framework** in engineering mode to orchestrate the reverse-engineering, component adaptation, and iterative generation loops.

### 1. Environment Setup & Launch
Spin up the reproducible container network that mirrors the local workspace:

```powershell
# Build the core image and start the container in the background
docker-compose up -d --build

# Attach directly to the interactive AdaL Engineer CLI session
docker exec -it vibe_agent_container adal --mode engineer
```
### 2. Execution Phases via `adal --mode engineer`
* **Phase 1: Component Cloning & Parsing:** Instructing AdaL to safely analyze and parse the structural layout, asset links, and functional scripts of the `autodoc.es` vehicle selector widget.
* **Phase 2: Adapter Refactoring:** Leveraging AdaL's self-correction loops to morph the cloned interface into a proprietary, clean front-end application focused on dynamic cost-estimation fields.
* **Phase 3: Database & Logic Binding:** Wiring the responsive selector output to the backend calculation engine to serve real-time dynamic charts.

---

## 🛡️ Guardrails & Operational Security
To secure the autonomous agent execution layer against adversarial attempts, a strict multi-tier security structure is implemented within our environment:

* **Input Filtering (Anti-Prompt Injection):** Explicit preprocessing boundaries intercept incoming prompts. The agent is strictly constrained from altering system parameters, bypassing calculation logic, or executing arbitrary system calls.
* **Deterministic Structured Outputs:** Outputs are bound to rigorous Pydantic schemas forcing clean JSON formatting. Any response violating the target pricing/cost calculation contract is discarded and retried automatically.
* **Business Parameter Boundaries:** Hard limits prevent the agent from outputting mathematically impossible cost scenarios or negative values.

---

## ⚙️ Effective System Prompt Design
The agent operates under a heavily optimized System Prompt that defines strict operational guardrails:

* **Role:** Expert Frontend Reverse-Engineer & Financial Data Architect.
* **Objective:** Seamlessly isolate target web components, strip telemetry/third-party scripts, and implement an accurate lifetime calculation pipeline based on vehicle metadata.
* **Constraints:** Maintain absolute component isolated state, prevent dependency bloat, refuse execution of unvalidated remote scripts, and enforce strict adherence to standard styling guidelines.

---

## 📊 Submission Deliverables & Evidence
* **`/src`:** Contains the full operational application source code modified by the agent.
* **`/screenshots`:** Visual walkthroughs demonstrating the initial cloning phase, prompt safety testing logs, and the finalized dynamic vehicle cost calculator interface.
* **`/logs`:** Full terminal trace outputs generated during the `adal --mode engineer` execution loop.