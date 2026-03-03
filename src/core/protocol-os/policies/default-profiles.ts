import { PolicyProfileJson } from '@/core/protocol-os/types';

type ProfileDef = {
  role: string;
  ownerName: string;
  weight: number;
  policyJson: PolicyProfileJson;
};

export const DEFAULT_POLICY_PROFILES: ProfileDef[] = [
  {
    role: 'Medical Policy',
    ownerName: 'Medical Lead',
    weight: 1,
    policyJson: {
      rules: [
        {
          id: 'med-hard-clinical-meaning',
          type: 'hard',
          targetNodeType: 'endpoint.primary',
          condition: { field: 'content.clinicalMeaning', op: 'truthy' },
          message: 'Primary endpoint must explain clinical meaning.',
          weight: 1
        },
        {
          id: 'med-soft-citation',
          type: 'soft',
          targetNodeType: 'endpoint.primary',
          condition: { field: 'citations.length', op: 'gte', value: 1 },
          message: 'Guideline or precedent citation is recommended.',
          weight: 20
        }
      ]
    }
  },
  {
    role: 'Stats Policy',
    ownerName: 'Biostat Lead',
    weight: 1,
    policyJson: {
      rules: [
        {
          id: 'stats-hard-power',
          type: 'hard',
          targetNodeType: 'assumptions.ledger',
          condition: { field: 'content.power', op: 'gte', value: 0.8 },
          message: 'Power must be >= 0.8.',
          weight: 1
        },
        {
          id: 'stats-soft-source',
          type: 'soft',
          targetNodeType: 'assumptions.ledger',
          condition: { field: 'citations.length', op: 'gte', value: 1 },
          message: 'Effect size and event assumptions should include sources.',
          weight: 20
        }
      ]
    }
  },
  {
    role: 'ClinOps Policy',
    ownerName: 'ClinOps Lead',
    weight: 1,
    policyJson: {
      rules: [
        {
          id: 'ops-soft-burden',
          type: 'soft',
          targetNodeType: 'soa.v0',
          condition: { field: 'impacts.burden', op: 'neq', value: 'High' },
          message: 'High burden SoA requires mitigation.',
          weight: 20
        },
        {
          id: 'ops-soft-recruitment',
          type: 'soft',
          targetNodeType: 'eligibility.core',
          condition: { field: 'impacts.recruitment', op: 'neq', value: 'High' },
          message: 'Eligibility should avoid severe recruitment penalty.',
          weight: 20
        }
      ]
    }
  },
  {
    role: 'Reg Policy',
    ownerName: 'Regulatory Lead',
    weight: 1,
    policyJson: {
      rules: [
        {
          id: 'reg-hard-endpoint-reference',
          type: 'hard',
          targetNodeType: 'endpoint.primary',
          condition: { field: 'citations.length', op: 'gte', value: 1 },
          message: 'Primary endpoint requires regulatory precedent/guideline citation.',
          weight: 1
        },
        {
          id: 'reg-soft-surrogate',
          type: 'soft',
          targetNodeType: 'endpoint.primary',
          condition: { field: 'content.type', op: 'neq', value: 'surrogate' },
          message: 'Surrogate endpoint needs additional justification.',
          weight: 20
        }
      ]
    }
  }
];
