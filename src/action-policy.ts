import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ActionPolicy {
  default: 'allow' | 'deny';
  allow?: string[];
  deny?: string[];
}

export type PolicyDecision = 'allow' | 'deny' | 'confirm';

const ACTION_CATEGORIES: Record<string, string> = {
  navigate: 'navigate',
  back: 'navigate',
  forward: 'navigate',
  reload: 'navigate',
  tab_new: 'navigate',

  click: 'click',
  dblclick: 'click',
  tap: 'click',

  fill: 'fill',
  type: 'fill',
  keyboard: 'fill',
  inserttext: 'fill',
  select: 'fill',
  multiselect: 'fill',
  check: 'fill',
  uncheck: 'fill',
  clear: 'fill',
  selectall: 'fill',
  setvalue: 'fill',

  download: 'download',
  waitfordownload: 'download',

  upload: 'upload',

  evaluate: 'eval',
  evalhandle: 'eval',
  addscript: 'eval',
  addinitscript: 'eval',

  snapshot: 'snapshot',
  screenshot: 'snapshot',
  pdf: 'snapshot',
  diff_snapshot: 'snapshot',
  diff_screenshot: 'snapshot',
  diff_url: 'snapshot',

  scroll: 'scroll',
  scrollintoview: 'scroll',

  wait: 'wait',
  waitforurl: 'wait',
  waitforloadstate: 'wait',
  waitforfunction: 'wait',

  gettext: 'get',
  content: 'get',
  innerhtml: 'get',
  innertext: 'get',
  inputvalue: 'get',
  url: 'get',
  title: 'get',
  getattribute: 'get',
  count: 'get',
  boundingbox: 'get',
  styles: 'get',
  isvisible: 'get',
  isenabled: 'get',
  ischecked: 'get',
  responsebody: 'get',

  route: 'network',
  unroute: 'network',
  requests: 'network',

  state_save: 'state',
  state_load: 'state',
  cookies_set: 'state',
  storage_set: 'state',
  credentials: 'state',

  hover: 'interact',
  focus: 'interact',
  drag: 'interact',
  press: 'interact',
  keydown: 'interact',
  keyup: 'interact',
  mousemove: 'interact',
  mousedown: 'interact',
  mouseup: 'interact',
  wheel: 'interact',
  dispatch: 'interact',

  // These are always allowed (internal/meta operations)
  launch: '_internal',
  close: '_internal',
  tab_list: '_internal',
  tab_switch: '_internal',
  tab_close: '_internal',
  window_new: '_internal',
  frame: '_internal',
  mainframe: '_internal',
  dialog: '_internal',
  session: '_internal',
  console: '_internal',
  errors: '_internal',
  cookies_get: '_internal',
  cookies_clear: '_internal',
  storage_get: '_internal',
  storage_clear: '_internal',
  state_list: '_internal',
  state_show: '_internal',
  state_clear: '_internal',
  state_clean: '_internal',
  state_rename: '_internal',
  highlight: '_internal',
  bringtofront: '_internal',
  trace_start: '_internal',
  trace_stop: '_internal',
  har_start: '_internal',
  har_stop: '_internal',
  video_start: '_internal',
  video_stop: '_internal',
  recording_start: '_internal',
  recording_stop: '_internal',
  recording_restart: '_internal',
  profiler_start: '_internal',
  profiler_stop: '_internal',
  clipboard: '_internal',
  viewport: '_internal',
  useragent: '_internal',
  device: '_internal',
  geolocation: '_internal',
  permissions: '_internal',
  emulatemedia: '_internal',
  offline: '_internal',
  headers: '_internal',
  addstyle: '_internal',
  expose: '_internal',
  timezone: '_internal',
  locale: '_internal',
  pause: '_internal',
  setcontent: '_internal',
  screencast_start: '_internal',
  screencast_stop: '_internal',
  input_mouse: '_internal',
  input_keyboard: '_internal',
  input_touch: '_internal',

  // Find/semantic locator actions
  getbyrole: 'click',
  getbytext: 'click',
  getbylabel: 'click',
  getbyplaceholder: 'click',
  getbyalttext: 'click',
  getbytitle: 'click',
  getbytestid: 'click',
  nth: 'click',
};

export function getActionCategory(action: string): string {
  return ACTION_CATEGORIES[action] ?? 'unknown';
}

export function loadPolicyFile(policyPath: string): ActionPolicy {
  const resolved = resolve(policyPath);
  const content = readFileSync(resolved, 'utf-8');
  const policy = JSON.parse(content) as ActionPolicy;

  if (policy.default !== 'allow' && policy.default !== 'deny') {
    throw new Error(
      `Invalid action policy: "default" must be "allow" or "deny", got "${policy.default}"`
    );
  }

  return policy;
}

export function checkPolicy(
  action: string,
  policy: ActionPolicy | null,
  confirmCategories: Set<string>
): PolicyDecision {
  const category = getActionCategory(action);

  // Internal actions are always allowed
  if (category === '_internal') return 'allow';

  // Check if this category requires confirmation
  if (confirmCategories.has(category)) return 'confirm';

  if (!policy) return 'allow';

  // Explicit allow list takes precedence
  if (policy.allow?.includes(category)) return 'allow';

  // Explicit deny list
  if (policy.deny?.includes(category)) return 'deny';

  return policy.default;
}

export function describeAction(action: string, command: Record<string, unknown>): string {
  const category = getActionCategory(action);
  switch (action) {
    case 'navigate':
      return `Navigate to ${command.url}`;
    case 'evaluate':
    case 'evalhandle':
      return `Evaluate JavaScript: ${String(command.script ?? '').slice(0, 80)}`;
    case 'fill':
      return `Fill ${command.selector} with value`;
    case 'type':
      return `Type into ${command.selector}`;
    case 'click':
    case 'dblclick':
    case 'tap':
      return `${action} ${command.selector}`;
    case 'download':
      return `Download via ${command.selector} to ${command.path}`;
    case 'upload':
      return `Upload files to ${command.selector}`;
    default:
      return `${category}: ${action}`;
  }
}
