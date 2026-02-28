# main.py
import os
import json
import glob
import ast
import traceback
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from openai import OpenAI

# ============================================================
# FastAPI app (MUST be defined before decorators)
# ============================================================
app = FastAPI()


# ============================================================
# Request models
# ============================================================
class Req(BaseModel):
    utterance: str
    slots: Optional[Dict[str, Any]] = None


class IntakeReq(BaseModel):
    utterance: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    org: Optional[str] = None
    team: Optional[str] = None
    need_summary: Optional[str] = None
    need_details: Optional[str] = None
    last_intent: Optional[str] = None
    last_skill_id: Optional[str] = None
    last_supported: Optional[bool] = None
    last_raw: Optional[Dict[str, Any]] = None


# ============================================================
# Exception handlers -> ALWAYS JSON
# ============================================================
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    ts = datetime.utcnow().isoformat()
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "ok": False,
            "error": "http_error",
            "status_code": exc.status_code,
            "detail": exc.detail,
            "path": str(request.url.path),
            "ts": ts,
        },
    )


@app.exception_handler(Exception)
async def all_exception_handler(request: Request, exc: Exception):
    ts = datetime.utcnow().isoformat()
    err = {
        "ok": False,
        "error": "internal_server_error",
        "type": type(exc).__name__,
        "message": str(exc),
        "path": str(request.url.path),
        "ts": ts,
    }
    # log stack trace
    log_path = os.getenv("LAB_ERROR_LOG", "/var/log/lab-errors.log")
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(
            f"{ts}\t{request.method}\t{request.url.path}\t{type(exc).__name__}\t{str(exc)}\n"
        )
        f.write(traceback.format_exc() + "\n\n")
    return JSONResponse(status_code=500, content=err)


# ============================================================
# Default initiatives (fallback)
# ============================================================
INITIATIVES = [
    {
        "id": "portfolio_mgmt",
        "group": "Trial design & planning",
        "name": "Portfolio management approach for milestones, budget and resources",
    },
    {
        "id": "trial_simulator",
        "group": "Trial design & planning",
        "name": "Boehringer specific trial simulator capability",
    },
    {
        "id": "site_startup",
        "group": "Trial delivery & submissions",
        "name": "Optimized site startup capability",
    },
    {
        "id": "site_selection",
        "group": "Trial delivery & submissions",
        "name": "Data driven trial footprint and site selection capability",
    },
    {
        "id": "partner_of_choice",
        "group": "Trial delivery & submissions",
        "name": 'Differentiated global "Partner-of-Choice" model',
    },
    {
        "id": "submission_closeout",
        "group": "Trial delivery & submissions",
        "name": "Submission and close-out acceleration capability",
    },
    {
        "id": "rbqm_quality",
        "group": "Trial delivery & submissions",
        "name": "Holistic analytics/AI-enabled and risk based clinical trial (data) quality mgmt approach",
    },
    {
        "id": "sourcing_cost",
        "group": "Trial delivery & submissions",
        "name": "Simplified clinical delivery and sourcing model to optimize costs",
    },
    {
        "id": "data_foundation",
        "group": "Data & AI",
        "name": "Integrated, scalable data and tech foundation",
    },
    {
        "id": "e2e_automation_authoring",
        "group": "Data & AI",
        "name": "AI tools for end-to-end automation, 1st step authoring",
    },
]

PIPELINES = {
    "site_selection": [
        "intent_parser",
        "slot_filler",
        "candidate_builder",
        "ranker",
        "explainability_narrator",
    ],
    "site_startup": ["intent_parser", "slot_filler", "timeline_model", "risk_flags", "deliver"],
    "submission_closeout": [
        "intent_parser",
        "doc_ingest",
        "checklist_runner",
        "auto_packager",
        "deliver",
    ],
    "rbqm_quality": [
        "intent_parser",
        "signals_extractor",
        "risk_model",
        "rbqm_recommendation",
        "deliver",
    ],
    "portfolio_mgmt": [
        "intent_parser",
        "constraints_parser",
        "scenario_builder",
        "optimizer",
        "deliver",
    ],
    "trial_simulator": [
        "intent_parser",
        "inputs_mapper",
        "sim_engine",
        "sensitivity_scan",
        "deliver",
    ],
    "partner_of_choice": [
        "intent_parser",
        "vendor_data_pull",
        "scorecard",
        "recommendation",
        "deliver",
    ],
    "sourcing_cost": [
        "intent_parser",
        "cost_drivers",
        "sourcing_options",
        "optimizer",
        "deliver",
    ],
    "data_foundation": ["intent_parser", "data_catalog_lookup", "lineage_view", "access_request", "deliver"],
    "e2e_automation_authoring": [
        "intent_parser",
        "doc_ingest",
        "outline_builder",
        "draft_writer",
        "qc_checker",
        "deliver",
    ],
}


# ============================================================
# Deterministic keyword fallback (multi-skill)
# NOTE: Do NOT depend on REG.skills, otherwise missing registry
# will make fallback silently skip.
# ============================================================
KEYWORD_FALLBACKS = {
    "e2e_automation_authoring": [
        "csr",
        "clinical study report",
        "medical writing",
        "protocol",
        "synopsis",
        "lay synopsis",
        "compare",
        "diff",
        "pdf table",
        "table to json",
    ],
    "site_selection": [
        "site selection",
        "site footprint",
        "feasibility",
        "select sites",
        "shortlist site",
        "shortlist sites",
        "site universe",
        "principal investigator",
        "pi",
        "h1",
        "recruitment site",
        "recruitment sites",
        "enrollment site",
        "enrollment sites",
    ],
    "site_startup": ["site startup", "startup", "activation", "ssu", "irb", "ec submission"],
    "submission_closeout": ["closeout", "submission", "packaging", "etmf", "finalization"],
    "rbqm_quality": ["rbqm", "risk based quality", "central monitoring", "quality signals"],
    "portfolio_mgmt": ["portfolio", "milestone", "budget", "resource planning"],
    "trial_simulator": ["trial simulator", "simulate trial", "simulation"],
    "partner_of_choice": ["partner of choice", "vendor model", "vendor scorecard"],
    "sourcing_cost": ["sourcing", "cost", "optimize cost", "cost drivers"],
    "data_foundation": ["data foundation", "data catalog", "lineage", "access request"],
}


def keyword_fallback_skill(utterance_lower: str) -> Optional[str]:
    best_sid = None
    best_hits = 0
    for sid, kws in KEYWORD_FALLBACKS.items():
        hits = sum(1 for k in kws if k in utterance_lower)
        if hits > best_hits:
            best_hits = hits
            best_sid = sid
    return best_sid if best_hits >= 1 else None


# ============================================================
# Helpers
# ============================================================
def _safe_json_loads(txt: str) -> dict:
    try:
        return json.loads(txt)
    except Exception:
        start = txt.find("{")
        end = txt.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(txt[start : end + 1])
        raise


def _normalize_enum(value: Any, options: List[str]) -> Any:
    if value is None:
        return None
    if not isinstance(value, str):
        return value

    def norm(x: str) -> str:
        return x.strip().lower().replace(" ", "").replace("-", "").replace("_", "")

    opts_map = {norm(o): o for o in options}
    return opts_map.get(norm(value), value)


def _merge_slots(existing: Dict[str, Any], model: Dict[str, Any]) -> Dict[str, Any]:
    merged = dict(existing or {})
    for k, v in (model or {}).items():
        if v is None:
            continue
        if isinstance(v, str) and not v.strip():
            continue
        merged[k] = v
    return merged


# ============================================================
# Safe rule evaluation for routing
# ============================================================
ALLOWED_NODES = (
    ast.Expression,
    ast.BoolOp,
    ast.UnaryOp,
    ast.Compare,
    ast.Name,
    ast.Load,
    ast.Constant,
    ast.List,
    ast.Tuple,
    ast.And,
    ast.Or,
    ast.Not,
    ast.In,
    ast.NotIn,
    ast.Eq,
    ast.NotEq,
)


def _eval_rule(expr: str, ctx: Dict[str, Any]) -> bool:
    if not expr or not expr.strip():
        return False

    tree = ast.parse(expr, mode="eval")
    for node in ast.walk(tree):
        if not isinstance(node, ALLOWED_NODES):
            raise ValueError(f"Disallowed expression node: {type(node).__name__}")

    def _eval(node):
        if isinstance(node, ast.Expression):
            return _eval(node.body)

        if isinstance(node, ast.BoolOp):
            if isinstance(node.op, ast.And):
                return all(_eval(v) for v in node.values)
            if isinstance(node.op, ast.Or):
                return any(_eval(v) for v in node.values)
            raise ValueError("Unsupported BoolOp")

        if isinstance(node, ast.UnaryOp):
            if isinstance(node.op, ast.Not):
                return not _eval(node.operand)
            raise ValueError("Unsupported UnaryOp")

        if isinstance(node, ast.Name):
            return ctx.get(node.id)

        if isinstance(node, ast.Constant):
            return node.value

        if isinstance(node, ast.List):
            return [_eval(e) for e in node.elts]

        if isinstance(node, ast.Tuple):
            return tuple(_eval(e) for e in node.elts)

        if isinstance(node, ast.Compare):
            left = _eval(node.left)
            ok = True
            for op, comp in zip(node.ops, node.comparators):
                right = _eval(comp)
                if isinstance(op, ast.Eq):
                    ok = ok and (left == right)
                elif isinstance(op, ast.NotEq):
                    ok = ok and (left != right)
                elif isinstance(op, ast.In):
                    ok = ok and (left in right)
                elif isinstance(op, ast.NotIn):
                    ok = ok and (left not in right)
                else:
                    raise ValueError("Unsupported comparator")
                left = right
            return ok

        raise ValueError(f"Unsupported node: {type(node).__name__}")

    return bool(_eval(tree))


# ============================================================
# Skill Registry
# ============================================================
class SkillRegistry:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        self.skills: Dict[str, Dict[str, Any]] = {}
        self.connectors: Dict[str, Dict[str, Any]] = {}
        self.reload()

    def reload(self):
        # Load connectors (optional)
        connectors_path = os.path.join(self.base_dir, "connectors", "connectors.json")
        if os.path.exists(connectors_path):
            with open(connectors_path, "r", encoding="utf-8") as f:
                self.connectors = json.load(f)
        else:
            self.connectors = {}

        # Load skills from disk (optional)
        self.skills = {}
        skills_dir = os.path.join(self.base_dir, "skills")
        for fp in sorted(glob.glob(os.path.join(skills_dir, "*.json"))):
            try:
                with open(fp, "r", encoding="utf-8") as f:
                    s = json.load(f)
                sid = s.get("id")
                if sid:
                    self.skills[sid] = s
            except Exception as e:
                print(f"[SkillRegistry] Failed to load {fp}: {e}")

        # Always ensure INITIATIVES exist even if skills folder is partially populated
        for x in INITIATIVES:
            sid = x["id"]
            if sid in self.skills:
                continue

            slots = {
                "country": {"type": "string", "required": False},
                "therapeutic_area": {"type": "string", "required": False},
                "phase": {"type": "string", "required": False},
                "objective": {"type": "string", "required": False},
                "priority": {"type": "string", "required": False},
            }

            # optional extra slots for site_selection (so conditional checks can work)
            if sid == "site_selection":
                slots.update(
                    {
                        "region": {"type": "string", "required": False},
                        "diversity_focus": {"type": "string", "required": False},
                    }
                )

            self.skills[sid] = {
                "id": sid,
                "name": x["name"],
                "channel": x["group"],
                "slots": slots,
                "clarifying_questions": {},
                "routing": {"rules": []},
                "pipeline": PIPELINES.get(sid, ["intent_parser", "deliver"]),
            }

    def list_skills(self) -> List[Dict[str, Any]]:
        out = []
        for sid, s in self.skills.items():
            out.append(
                {
                    "id": sid,
                    "name": s.get("name", sid),
                    "channel": s.get("channel", "Unknown"),
                    "num_slots": len((s.get("slots") or {}).keys()),
                }
            )
        return sorted(out, key=lambda x: x["id"])

    def get_skill(self, sid: str) -> Dict[str, Any]:
        s = self.skills.get(sid)
        if not s:
            raise KeyError(sid)
        return s


REG = SkillRegistry(base_dir=os.getenv("LAB_BASE_DIR", "/root/lab-orchestrator"))


# ============================================================
# LLM: router + slot extractor (Qwen via OpenAI-compatible)
# ============================================================
def qwen_route_and_extract(
    utterance: str, existing_slots: Dict[str, Any], skills: List[Dict[str, Any]]
) -> dict:
    base_url = os.getenv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    model = os.getenv("QWEN_MODEL", "qwen-plus")
    api_key = os.getenv("DASHSCOPE_API_KEY")
    timeout_s = float(os.getenv("QWEN_TIMEOUT", "15"))

    if not api_key:
        return {
            "supported": False,
            "initiative_id": None,
            "confidence": 0.0,
            "rationale_short": "missing_api_key",
            "slots": {},
        }

    # OpenAI client init compatibility (avoid TypeError across versions)
    try:
        client = OpenAI(api_key=api_key, base_url=base_url, timeout=timeout_s, max_retries=0)
    except TypeError:
        client = OpenAI(api_key=api_key, base_url=base_url)

    skills_text_lines = []
    for s in skills:
        try:
            keys = list((REG.get_skill(s["id"]).get("slots") or {}).keys())
        except Exception:
            keys = []
        skills_text_lines.append(
            f"- {s['id']}: {s['name']} (channel: {s['channel']}, slot_keys: {keys})"
        )
    skills_text = "\n".join(skills_text_lines)

    system = (
        "You are an intent router and slot extractor for a Medicine Data & AI portal.\n"
        "Choose the best matching initiative_id from the provided skills list.\n"
        "If none matches, set supported=false and initiative_id=null.\n"
        "Return ONLY valid JSON.\n"
        "JSON schema:\n"
        "{\n"
        '  "supported": boolean,\n'
        '  "initiative_id": string|null,\n'
        '  "confidence": number,\n'
        '  "rationale_short": string,\n'
        '  "slots": object\n'
        "}\n"
        "Rules:\n"
        "- confidence is 0-1.\n"
        "- slots should only include keys that are likely relevant.\n"
        "- Use existing slots as context; do not erase them.\n"
    )

    user = (
        f"User request: {utterance}\n\n"
        f"Existing slots (may be partial): {json.dumps(existing_slots or {}, ensure_ascii=False)}\n\n"
        f"Skills:\n{skills_text}\n\n"
        "Return JSON only."
    )

    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0,
            response_format={"type": "json_object"},
        )
        txt = resp.choices[0].message.content.strip()
        return _safe_json_loads(txt)
    except Exception as e:
        return {
            "supported": False,
            "initiative_id": None,
            "confidence": 0.0,
            "rationale_short": f"llm_error: {type(e).__name__}",
            "slots": {},
        }


# ============================================================
# Validation + clarifying from config
# ============================================================
def validate_and_enrich(
    skill: Dict[str, Any], slots: Dict[str, Any]
) -> Tuple[Dict[str, Any], List[str], Dict[str, Any]]:
    slots_def = skill.get("slots") or {}
    normalized = dict(slots or {})
    field_specs: Dict[str, Any] = {}

    for key, spec in slots_def.items():
        ftype = spec.get("type", "string")
        required = bool(spec.get("required", False))
        options = spec.get("options", None)

        if options and key in normalized:
            normalized[key] = _normalize_enum(normalized.get(key), options)

        field_specs[key] = {
            "type": ftype,
            "required": required,
            "options": options,
            "resolver": spec.get("resolver"),
        }

    missing: List[str] = []
    for key, spec in slots_def.items():
        if spec.get("required"):
            v = normalized.get(key)
            if v is None or (isinstance(v, str) and not v.strip()):
                missing.append(key)

    return normalized, missing, field_specs


def build_clarifying_questions(skill: Dict[str, Any], missing_fields: List[str]) -> List[str]:
    qmap = skill.get("clarifying_questions") or {}
    return [qmap.get(f, f"Please provide: {f}") for f in missing_fields]


def compute_route_target(skill: Dict[str, Any], slots: Dict[str, Any]) -> Optional[str]:
    routing = skill.get("routing") or {}
    rules = routing.get("rules") or []
    for r in rules:
        cond = r.get("if")
        target = r.get("target")
        if not cond or not target:
            continue
        try:
            if _eval_rule(cond, slots):
                return target
        except Exception:
            continue
    return None


# ============================================================
# Tool card builder
# ============================================================
def build_tool_card(target: Optional[str], slots: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not target:
        return None

    if target == "tool_h1_site_universe":
        ta = slots.get("therapeutic_area")
        phase = slots.get("phase")
        return {
            "type": "external_tool",
            "title": "H1 Clinical — Site Universe (US diversity-aware site selection)",
            "link": "https://h1.co/clinical/site-universe/",
            "why": f"US site selection with patient diversity/representation focus. (TA={ta}, Phase={phase})",
            "who_can_use": ["Authorized users under an organizational H1 license/subscription"],
            "how_to_use": ["Define population", "Filter geography=US", "Review signals", "Export shortlist"],
            "access_note": "Requires organizational access.",
        }

    if target == "tool_alphalife_csr_pilot":
        return {
            "type": "external_tool",
            "title": "AlphaLife — CSR Drafting (Pilot)",
            "link": "about:blank",
            "why": "Generate CSR first draft with AI-assisted medical writing in pilot.",
            "who_can_use": ["Pilot cohort only"],
            "how_to_use": ["Prepare inputs", "Generate sections", "Human QC", "Export DOCX"],
            "access_note": "Pilot only.",
        }

    if target == "tool_ginidoc_future_internal":
        return {
            "type": "internal_tool",
            "title": "GiniDoc — Authoring Suite (Future internal deployment)",
            "link": "about:blank",
            "why": "IBM co-dev authoring suite planned for internal deployment.",
            "who_can_use": ["Future internal rollout"],
            "how_to_use": ["Select doc type", "Guided drafting", "QC", "Publish/export"],
            "access_note": "Roadmap.",
        }

    mapping = {
        "app_protocol_structure_builder": "Protocol Structure Authoring — Template & Section Builder",
        "app_lay_synopsis_generator": "Lay Protocol Synopsis Generator",
        "app_doc_compare": "Document Compare — Diff Report Generator",
        "app_pdf_table_to_json": "PDF Tables → JSON (TFL extraction)",
        "app_qc_packager": "QC & Packaging — Authoring Deliverables",
    }
    if target in mapping:
        return {
            "type": "internal_tool",
            "title": mapping[target],
            "link": "about:blank",
            "why": "Internal tool placeholder handoff.",
            "who_can_use": ["Internal users"],
            "how_to_use": ["Provide inputs", "Run tool", "Review outputs", "Export"],
            "access_note": "Demo wiring.",
        }

    return None


# ============================================================
# Intake API
# ============================================================
@app.post("/api/intake")
def intake(req: IntakeReq):
    if not req.utterance or not req.utterance.strip():
        raise HTTPException(status_code=400, detail="utterance is required")

    ts = datetime.utcnow().isoformat()
    record = {
        "ts": ts,
        "utterance": req.utterance.strip(),
        "contact_name": (req.contact_name or "").strip() or None,
        "contact_email": (req.contact_email or "").strip() or None,
        "org": (req.org or "").strip() or None,
        "team": (req.team or "").strip() or None,
        "need_summary": (req.need_summary or "").strip() or None,
        "need_details": (req.need_details or "").strip() or None,
        "last_supported": req.last_supported,
        "last_intent": req.last_intent,
        "last_skill_id": req.last_skill_id,
        "last_raw": req.last_raw,
    }

    path = os.getenv("LAB_INTAKE_LOG", "/var/log/lab-intake.jsonl")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

    return {"ok": True, "saved": True}


# ============================================================
# APIs
# ============================================================
@app.get("/api/health")
def health():
    return {"ok": True, "skills_loaded": len(REG.skills)}


@app.get("/api/skills")
def list_skills():
    return {"skills": REG.list_skills()}


@app.get("/api/skills/{skill_id}")
def get_skill(skill_id: str):
    try:
        s = REG.get_skill(skill_id)
        return {
            "id": s.get("id"),
            "name": s.get("name"),
            "channel": s.get("channel"),
            "slots": s.get("slots", {}),
            "clarifying_questions": s.get("clarifying_questions", {}),
            "routing": s.get("routing", {}),
            "pipeline": s.get("pipeline", []),
        }
    except KeyError:
        raise HTTPException(status_code=404, detail="Skill not found")


# ============================================================
# Triage API
# ============================================================
@app.post("/api/triage")
def triage(req: Req):
    existing_slots = req.slots or {}

    skills_for_llm = REG.list_skills()
    llm = qwen_route_and_extract(req.utterance, existing_slots, skills_for_llm)

    supported = bool(llm.get("supported"))
    sid = llm.get("initiative_id")
    conf = float(llm.get("confidence", 0.2) or 0.2)
    rationale = llm.get("rationale_short", "")

    # ------------------------------------------------------------
    # Deterministic fallback (covers all key skills)
    # Trigger when:
    #  - LLM says unsupported / invalid skill
    #  - OR confidence too low (stabilize first-turn)
    #  - OR missing api key => LLM unsupported => fallback should route
    # ------------------------------------------------------------
    u = (req.utterance or "").lower()
    if (not supported) or (not sid) or (sid not in REG.skills) or conf < 0.55:
        fb = keyword_fallback_skill(u)
        if fb:
            # Ensure registry has default skill definition for fb
            if fb not in REG.skills:
                REG.reload()
            supported = True
            sid = fb
            conf = max(conf, 0.75)
            llm = {
                **(llm or {}),
                "supported": True,
                "initiative_id": sid,
                "confidence": conf,
                "rationale_short": (rationale or "") + f" | fallback: keywords->{sid}",
                "slots": llm.get("slots") or {},
            }

    if (not supported) or (not sid) or (sid not in REG.skills):
        ts = datetime.utcnow().isoformat()
        with open("/var/log/lab-unsupported.log", "a", encoding="utf-8") as f:
            f.write(f"{ts}\t{req.utterance.replace(chr(10), ' ').replace(chr(9), ' ')}\n")

        return {
            "utterance": req.utterance,
            "supported": False,
            "intent": None,
            "skill_id": None,
            "confidence": conf,
            "routed_channel": None,
            "initiative": None,
            "slots": existing_slots,
            "missing_fields": [],
            "field_specs": {},
            "need_clarification": False,
            "clarifying_questions": [],
            "execution_plan": [],
            "target_connector": None,
            "tool_card": None,
            "next_action": "captured_for_analysis",
            "llm": llm,
            "intake": {
                "enabled": True,
                "message": "Not supported yet. Would you like to register this request for future prioritization?",
                "fields": ["contact_name", "contact_email", "org", "team", "need_summary", "need_details"],
            },
        }

    skill = REG.get_skill(sid)

    model_slots = llm.get("slots") or {}
    merged_slots = _merge_slots(existing_slots, model_slots)
    normalized_slots, missing_fields, field_specs = validate_and_enrich(skill, merged_slots)

    # ------------------------------------------------------------
    # Slot aliasing + region normalization BEFORE conditional checks
    # ------------------------------------------------------------
    if sid == "site_selection":
        rv = normalized_slots.get("region") or normalized_slots.get("country")
        if isinstance(rv, str) and rv.strip():
            rvl = rv.strip().lower()
            if rvl in ["usa", "united states", "unitedstates", "us", "u.s.", "u.s"]:
                normalized_slots["region"] = "US"
            else:
                normalized_slots["region"] = rv

    # ------------------------------------------------------------
    # Conditional required fields
    # ------------------------------------------------------------
    if sid == "site_selection" and normalized_slots.get("region") == "US":
        v = normalized_slots.get("diversity_focus")
        if v is None or (isinstance(v, str) and not v.strip()):
            if "diversity_focus" not in missing_fields:
                missing_fields.append("diversity_focus")

    if sid == "e2e_automation_authoring":
        sub_task = (normalized_slots.get("sub_task") or "").strip()
        if sub_task == "csr_drafting":
            for f in ["tool_preference", "pilot_ok"]:
                v = normalized_slots.get(f)
                if v is None or (isinstance(v, str) and not v.strip()):
                    if f not in missing_fields:
                        missing_fields.append(f)

    need = len(missing_fields) > 0
    questions = build_clarifying_questions(skill, missing_fields) if need else []

    target = compute_route_target(skill, normalized_slots)

    # fallback routing if no config rules exist
    if (not target) and sid == "site_selection" and normalized_slots.get("region") == "US":
        target = "tool_h1_site_universe"

    tool_card = build_tool_card(target, normalized_slots)

    pipeline = skill.get("pipeline") or PIPELINES.get(sid, ["intent_parser", "deliver"])
    if need:
        apps = ["intent_parser", "slot_filler"]
        next_action = "ask_clarifying_questions"
    else:
        apps = pipeline
        next_action = "execute_plan"

    return {
        "utterance": req.utterance,
        "supported": True,
        "intent": sid,
        "skill_id": sid,
        "confidence": conf,
        "routed_channel": skill.get("channel", "Unknown"),
        "initiative": skill.get("name", sid),
        "slots": normalized_slots,
        "missing_fields": missing_fields,
        "field_specs": field_specs,
        "need_clarification": need,
        "clarifying_questions": questions,
        "target_connector": target,
        "tool_card": tool_card,
        "execution_plan": [{"step": i + 1, "app": a} for i, a in enumerate(apps)],
        "next_action": next_action,
        "llm": llm,
        "intake": {"enabled": False},
    }


# ============================================================
# Optional local run:
#   python main.py
# ============================================================
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=bool(int(os.getenv("RELOAD", "0"))),
    )