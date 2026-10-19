import type { Platform, WidgetType } from '@/types';

/** The 16 widget types, in the order the picker shows them, with a 24×24 stroke icon. */
export const WIDGET_TYPES: { id: WidgetType; name: string; icon: string }[] = [
  { id: 'description', name: 'Description', icon: '<path d="M5 6h14M5 10h14M5 14h10M5 18h7"/>' },
  { id: 'key-facts', name: 'Key facts', icon: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6M16 7h5M16 11h5M17 15h4"/>' },
  { id: 'amenities', name: 'Amenities', icon: '<path d="M4 7.5l2 2 3.5-4M4 16.5l2 2 3.5-4M13 8h7M13 17h7"/>' },
  { id: 'gallery', name: 'Photo gallery', icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>' },
  { id: 'house-rules', name: 'House rules', icon: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>' },
  { id: 'sleeping', name: 'Sleeping arrangements', icon: '<path d="M3 18V7m0 7h18v4m0-4v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.8"/>' },
  { id: 'space-area', name: 'The space and the area', icon: '<path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>' },
  { id: 'reviews', name: 'Reviews', icon: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>' },
  { id: 'rating-summary', name: 'Rating summary', icon: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>' },
  { id: 'calendar', name: 'Availability calendar', icon: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2"/>' },
  { id: 'price-from', name: 'Price from', icon: '<path d="M20.5 13.5l-7 7a2 2 0 0 1-2.8 0L3 12.8V3h9.8l7.7 7.7a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>' },
  { id: 'policies-fees', name: 'Policies and fees', icon: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>' },
  { id: 'local-guide', name: 'Local guide', icon: '<path d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>' },
  { id: 'also-listed-on', name: 'Also listed on', icon: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>' },
  { id: 'meet-host', name: 'Meet your host', icon: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/>' },
  { id: 'property-list', name: 'Property list', icon: '<rect x="3" y="4" width="8" height="7" rx="1.5"/><rect x="13" y="4" width="8" height="7" rx="1.5"/><rect x="3" y="13" width="8" height="7" rx="1.5"/><rect x="13" y="13" width="8" height="7" rx="1.5"/>' },
];

/** Where to paste the snippet, per website builder. Steps may contain <b> and <code>. */
export const PLATFORMS: { id: Platform; label: string; steps: string[] }[] = [
  {
    id: 'wix',
    label: 'Wix',
    steps: [
      'In the Wix Editor, click <b>Add Elements (+)</b> → <b>Embed Code</b> → <b>Embed HTML</b>.',
      'Click <b>Enter Code</b>, make sure <b>Code</b> is selected, paste your snippet and click <b>Update</b>.',
      'Drag the element\'s bottom handle to the height shown above. Wix does not resize embeds on its own.',
      'Switch to the <b>mobile</b> view in the Editor, set the mobile height too, then <b>Publish</b>.',
      'More widgets: give each one its own Embed HTML with its whole snippet, because every embed is a separate frame. Widgets that sit one under the other can share one embed: paste their elements together and the script once.',
    ],
  },
  {
    id: 'squarespace',
    label: 'Squarespace',
    steps: [
      'Edit the page, click <b>Add Block</b> and choose <b>Code</b>.',
      'Paste your snippet, leave the mode on <b>HTML</b>, and turn off <b>Display Source</b>.',
      'Save and publish. Code blocks that run scripts need a plan that allows JavaScript.',
      'More widgets: add a Code block for each. Widgets of the same property share one request to your Worker.',
    ],
  },
  {
    id: 'wordpress',
    label: 'WordPress',
    steps: [
      'In the block editor, click <b>+</b> and add a <b>Custom HTML</b> block.',
      'Paste your snippet and click <b>Update</b> or <b>Publish</b>.',
      'On WordPress.com, scripts in pages need a Business plan or higher.',
      'More widgets: add a Custom HTML block for each. Widgets of the same property share one request to your Worker.',
    ],
  },
  {
    id: 'webflow',
    label: 'Webflow',
    steps: [
      'Open the <b>Add</b> panel and drag a <b>Code Embed</b> element onto the page.',
      'Paste your snippet and click <b>Save &amp; Close</b>, then publish. Embeds run on the published site.',
      'More widgets: add a Code Embed for each. Widgets of the same property share one request to your Worker.',
    ],
  },
  {
    id: 'other',
    label: 'Any other site',
    steps: [
      'Paste the snippet wherever your website builder lets you add HTML: an "HTML", "Code" or "Embed" block.',
      'Several widgets on one page share one copy of <code>widget.js</code>, so pasting it twice does no harm, and widgets of the same property share one request to your Worker.',
    ],
  },
];
