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


the first command will be:

docker exec -it vibe_agent_container adal --mode engineer

### first prompt: 

"Clone the main above-the-fold header section of https://www.autodoc.es/, specifically isolating the complete interactive vehicle search selector component (the multi-tab interface for selecting Passenger Cars, Trucks, Motorcycles, etc., by make, model, and engine). Save the full component inside './autodoc-clone'. It must be functionally and visually identical down to the pixel level, replicating all layout structures, dynamic dropdown behaviors, fonts, exact color tokens, hover states, animations, and any embedded media or layout effects. You have two docs to refer to inside your workspace: 1. ./clone-web/clone_guide_v2.md (operational guide + appendices) which you must follow implicitly, and 2. ./clone-web/clone_landing_page_101.md (deep reference) to consult if stuck. Use MiniMax M3 Browser Use for both evaluator and builder."

### second prompt: 

"Execute Phase 2 implementation, building the final web application completely inside the dedicated directory './auto-evaluation/app/'. Use the cloned interface in './autodoc-clone' as your base layout layout and asset reference. You must strictly read, ingest, and adhere to the architectural rules defined in './auto-evaluation/logic_guide_v1.md' for your backend engineering, and './auto-evaluation/visual_architecture_101.md' for all UI injection and chart styles.

Core Execution Plan:
1. Data Pipeline: Extract the data vault archives ('./auto-evaluation/data/archive.zip' and './auto-evaluation/data/car+evaluation.zip') and run the Heuristic Alignment Matrix to merge the datasets.
2. Backend Logic: Build the deterministic 5-year cost engine with strict Pydantic JSON schema validation, ensuring all calculations are wired to serve the frontend app inside './auto-evaluation/app/'.
3. Frontend UI Deployment: Generate and place the complete dashboard interface inside './auto-evaluation/app/'. Ensure it dynamically injects below the Autodoc vehicle selector and strictly utilizes the official Autodoc CSS design tokens (colors, borders, and smooth transitions).
4. Visualization: Integrate Chart.js or ApexCharts via CDN to render the cumulative 5-year operational cost splits and the geometric Reliability Radar Chart.
5. Verification: Deploy the adversary evaluation worker to run the visual and functional validation scripts against the application assembly inside './auto-evaluation/app/'. Fix any layout shifts, unstyled backgrounds, or path errors before finishing."
