import React from 'react';

const ICON_IDS = {
  add: '84991',
  apartment: '103552',
  approval: '84992',
  archive: '110631',
  arrow_back: '84994',
  arrow_forward: '87701',
  analytics: '116128',
  back: '84994',
  bank_account: 'E7yeZ1rv9DJw',
  bed: '87259',
  building: '86622',
  calendar: '84997',
  check: '83319',
  checkmark: '82769',
  chevron_left: '88084',
  chevron_right: '85770',
  close: '82771',
  content: '90311',
  dashboard: 'aVHe2jHuORcA',
  delete: '99933',
  door: '106083',
  edit: '86715',
  email: '85467',
  empty_box: '103553',
  error: '82783',
  eye: '85028',
  filter: '85451',
  forward: '87701',
  graph_report: '92558',
  help: '83244',
  high_priority: '85032',
  history: '115230',
  invoice: '106571',
  key: '82753',
  location: '85049',
  logout: '82792',
  meeting_room: '91730',
  nothing_found: '83269',
  phone: '85059',
  print: '85067',
  profile: '103517',
  privacy_policy: 'jBzielDa22bd',
  receipt: '100254',
  refresh: '85469',
  rent: '88424',
  search: '82712',
  settings: '82535',
  shield: '87367',
  transaction: '92225',
  trending_up: '83248',
  group: '85470',
  unavailable: '82553',
  user_group: '85470',
  verified_account: '85086',
  visibility_off: '96151',
  warning: '85032',
  clock: '82767',
  lightning: '86554',
};

export default function Icons8Icon({ icon, className = '', label }) {
  const iconId = ICON_IDS[icon];

  if (!iconId) return null;

  return (
    <img
      className={`icons8-navigation-icon ${className}`}
      src={`https://img.icons8.com/?id=${iconId}&format=png&size=64`}
      alt={label || ''}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' })}
      draggable="false"
    />
  );
}

export { ICON_IDS };
