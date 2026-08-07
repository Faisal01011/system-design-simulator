import { GlobalMetrics, SystemComponent } from '../types';

export interface Challenge {
  id: string;
  title: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  targetRps: number;
  maxP95Ms: number;
  maxErrorRate: number;
  budget: number;
  starterTemplate: string;
  requiredTypes: Array<SystemComponent['type']>;
  minServers: number;
  xp: number;
  lesson: string;
}

export interface ChallengeResult {
  score: number;
  cost: number;
  passed: boolean;
  checks: Array<{ label: string; passed: boolean; value: string }>;
  feedback: string[];
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'scale-monolith',
    title: 'Save the Monolith',
    subtitle: 'Scale a simple app before traffic overwhelms it.',
    difficulty: 'Beginner',
    targetRps: 250,
    maxP95Ms: 300,
    maxErrorRate: 0.08,
    budget: 2600,
    starterTemplate: 'monolith',
    requiredTypes: ['loadBalancer'],
    minServers: 2,
    xp: 120,
    lesson: 'Horizontal scaling adds application capacity; a load balancer spreads traffic across replicas.',
  },
  {
    id: 'cache-pressure',
    title: 'Protect the Database',
    subtitle: 'Use caching to keep a read-heavy API responsive.',
    difficulty: 'Intermediate',
    targetRps: 700,
    maxP95Ms: 220,
    maxErrorRate: 0.05,
    budget: 5200,
    starterTemplate: 'classic-3tier',
    requiredTypes: ['cache', 'loadBalancer'],
    minServers: 2,
    xp: 220,
    lesson: 'A high cache hit rate reduces database traffic and usually improves tail latency.',
  },
  {
    id: 'async-spike',
    title: 'Absorb a Traffic Spike',
    subtitle: 'Decouple work with a queue so sudden bursts do not crush the app.',
    difficulty: 'Intermediate',
    targetRps: 1100,
    maxP95Ms: 350,
    maxErrorRate: 0.08,
    budget: 7200,
    starterTemplate: 'high-traffic',
    requiredTypes: ['messageQueue', 'loadBalancer'],
    minServers: 3,
    xp: 300,
    lesson: 'Queues buffer spikes and decouple producers from slower consumers.',
  },
  {
    id: 'edge-scale',
    title: 'Global Launch',
    subtitle: 'Build an edge-aware architecture for a worldwide launch.',
    difficulty: 'Advanced',
    targetRps: 1700,
    maxP95Ms: 250,
    maxErrorRate: 0.04,
    budget: 9800,
    starterTemplate: 'high-traffic',
    requiredTypes: ['cdn', 'apiGateway', 'cache', 'loadBalancer'],
    minServers: 3,
    xp: 450,
    lesson: 'CDNs and gateways reduce origin pressure while load balancing and caching protect the core services.',
  },
];

const MONTHLY_COST: Record<SystemComponent['type'], number> = {
  client: 0,
  apiGateway: 320,
  loadBalancer: 450,
  server: 850,
  cache: 700,
  database: 1400,
  messageQueue: 500,
  cdn: 600,
};

export function estimateMonthlyCost(components: SystemComponent[]) {
  return components.reduce((sum, component) => sum + MONTHLY_COST[component.type], 0);
}

export function evaluateChallenge(
  challenge: Challenge,
  components: SystemComponent[],
  metrics: GlobalMetrics
): ChallengeResult {
  const cost = estimateMonthlyCost(components);
  const serverCount = components.filter((c) => c.type === 'server').length;
  const healthyServerCount = components.filter((c) => c.type === 'server' && c.isHealthy).length;
  const types = new Set(components.map((c) => c.type));
  const hasRequired = challenge.requiredTypes.every((type) => types.has(type));
  const hasScale = serverCount >= challenge.minServers;
  const hasRedundancy = healthyServerCount >= 2;
  const trafficPass = metrics.throughput >= challenge.targetRps * 0.72;
  const latencyPass = metrics.p95Latency > 0 && metrics.p95Latency <= challenge.maxP95Ms;
  const errorPass = metrics.totalRequests > 0 && metrics.errorRate <= challenge.maxErrorRate;
  const budgetPass = cost <= challenge.budget;

  const checks = [
    { label: 'Throughput', passed: trafficPass, value: `${metrics.throughput.toFixed(0)} / ${challenge.targetRps} rps` },
    { label: 'p95 latency', passed: latencyPass, value: `${metrics.p95Latency.toFixed(0)} / ${challenge.maxP95Ms} ms` },
    { label: 'Error rate', passed: errorPass, value: `${(metrics.errorRate * 100).toFixed(1)}% / ${(challenge.maxErrorRate * 100).toFixed(0)}%` },
    { label: 'Budget', passed: budgetPass, value: `$${cost.toLocaleString()} / $${challenge.budget.toLocaleString()}` },
    { label: 'Required components', passed: hasRequired, value: hasRequired ? 'present' : 'missing' },
    { label: 'Horizontal scale', passed: hasScale, value: `${serverCount} server${serverCount === 1 ? '' : 's'}` },
    { label: 'Redundancy', passed: hasRedundancy, value: `${healthyServerCount} healthy servers` },
  ];

  const weights = [24, 18, 16, 14, 12, 10, 6];
  const score = Math.round(checks.reduce((total, check, index) => total + (check.passed ? weights[index] : 0), 0));
  const passed = score >= 75 && trafficPass && errorPass;

  const feedback: string[] = [];
  if (!trafficPass) feedback.push('Your architecture is not completing enough requests. Add application capacity or remove a bottleneck.');
  if (!latencyPass) feedback.push('Tail latency is too high. Check the busiest component, improve cache hit rate, or add capacity.');
  if (!errorPass) feedback.push('Too many requests are failing. Look for overloaded or unhealthy components and add redundancy.');
  if (!budgetPass) feedback.push('The design exceeds budget. Remove unnecessary infrastructure or find a cheaper scaling strategy.');
  if (!hasRequired) feedback.push(`This challenge expects: ${challenge.requiredTypes.join(', ')}.`);
  if (!hasScale) feedback.push(`Add at least ${challenge.minServers} app servers to demonstrate horizontal scaling.`);
  if (!hasRedundancy) feedback.push('A single healthy app server is a single point of failure. Add another replica.');
  if (feedback.length === 0) feedback.push('Strong design. Try raising traffic further or reducing cost without losing reliability.');

  return { score, cost, passed, checks, feedback };
}
