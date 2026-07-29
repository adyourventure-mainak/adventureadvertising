/* ============================================================
   Adventure Advertising — data
   View counts are rounded public estimates, usually aggregating a
   brand's own upload with re-uploads, cut-downs and re-releases.
   Order-of-magnitude signal, not a scoreboard.
   ============================================================ */

const CATEGORIES = [
  { id: 'all',        label: 'Everything' },
  { id: 'stunt',      label: 'Stunt' },
  { id: 'demo',       label: 'Product demo' },
  { id: 'comedy',     label: 'Comedy' },
  { id: 'experiment', label: 'Social experiment' },
  { id: 'emotional',  label: 'Emotional turn' },
  { id: 'manifesto',  label: 'Manifesto' }
];

const BUDGETS = [
  { id: 'any',         label: 'Any budget' },
  { id: 'garage',      label: 'Under $50k' },
  { id: 'mid',         label: '$50k–$500k' },
  { id: 'blockbuster', label: 'Agency budget' }
];

const ADS = [
  {
    id: 'purple-egg',
    verified: true,
    videoId: '4BvwpjaGZCQ',
    thumb: 'https://i.ytimg.com/vi/4BvwpjaGZCQ/maxresdefault.jpg',
    brand: 'Purple',
    title: 'The Raw Egg Test',
    year: 2016,
    views: '~200M',
    viewsNum: 200,
    category: 'demo',
    budget: 'mid',
    runtime: '2:30',
    formula: 'absurd-demo',
    poster: { c1: '#5B3FD9', c2: '#0C0B0E', motif: 'drop' },
    hook: 'Four raw eggs, a sheet of glass, and 330 pounds dropped on top of them.',
    why: 'A mattress is the hardest thing on earth to demonstrate on video — you cannot feel foam through a screen. Purple invented a physical test that produces a binary, unfakeable result in one shot, then wrapped it in a fairy-tale character so the science segment played like entertainment.',
    beats: [
      { t: '0:00', label: 'Absurd promise', desc: 'A costumed Goldilocks announces she will test a mattress with eggs. You stay because you cannot guess where this is going.' },
      { t: '0:35', label: 'Set up the stakes', desc: 'The eggs are shown to be real and raw. The failure state is made vivid before the test runs.' },
      { t: '1:20', label: 'The test', desc: 'Weight drops. Single continuous shot, no cutaway — the lack of a cut is the evidence.' },
      { t: '1:50', label: 'Translate to benefit', desc: 'Eggs intact → pressure distribution → your hips and shoulders. The science lands only after the spectacle earns it.' },
      { t: '2:15', label: 'Offer', desc: 'Direct-response close with a hard reason to click now.' }
    ],
    playbook: [
      { h: 'Find your egg', d: 'List every claim you make in copy. Circle the one a stranger could verify with their own eyes in under 10 seconds. That is your test.' },
      { h: 'Make failure visible', d: 'The audience must be able to picture the mess. If nothing can visibly break, there is no tension and no reason to watch.' },
      { h: 'Shoot it in one take', d: 'The moment you cut, viewers assume a trick. Frame wide enough that the whole apparatus stays in shot from setup to result.' },
      { h: 'Add one character', d: 'A demo alone is a science video. One costumed, over-committed performer turns it into something people send to a friend.' },
      { h: 'Land the translation', d: 'Immediately convert the spectacle into the customer benefit in one plain sentence, or you will be remembered for eggs and not for the product.' }
    ],
    kit: ['One provable claim', 'A physical test rig', 'One committed performer', 'Wide lens, locked-off tripod', 'A director who will not cut'],
    trap: 'Falling in love with the stunt and forgetting the translation. If a viewer cannot say what your product does after watching, you made a magic trick, not an ad.',
    cost: 'Reported low six figures with a specialist direct-response shop — but the format survives being shot for a few thousand.',
    query: 'Purple mattress raw egg test Goldilocks ad'
  },
  {
    id: 'dumb-ways',
    verified: true,
    videoId: 'IJNR2EpS0jw',
    thumb: 'https://i.ytimg.com/vi/IJNR2EpS0jw/sddefault.jpg',
    brand: 'Metro Trains Melbourne',
    title: 'Dumb Ways to Die',
    year: 2012,
    views: '~355M',
    viewsNum: 355,
    category: 'comedy',
    budget: 'mid',
    runtime: '3:00',
    formula: 'emotional-turn',
    poster: { c1: '#1FB6C4', c2: '#0C0B0E', motif: 'grid' },
    hook: 'A sweet ukulele song about idiotic ways to kill yourself — and then, at the very end, railway safety.',
    why: 'Public safety messaging fails because it scolds. This one buried the instruction under three minutes of cute, singable comedy, so the audience adopted the message voluntarily — as a song, a game, and a meme — instead of being lectured with it.',
    beats: [
      { t: '0:00', label: 'Tone mismatch', desc: 'Nursery-song music over cheerful characters dying stupidly. The gap between tone and content is the entire hook.' },
      { t: '0:20', label: 'Escalating list', desc: 'Gag after gag, each self-contained. Any three-second clip works alone, which is what makes it shareable.' },
      { t: '2:10', label: 'The turn', desc: 'The final three deaths are the actual safety message, delivered in the same nursery tone.' },
      { t: '2:40', label: 'Line + logo', desc: 'One line naming the real subject. No lecture, no statistics.' }
    ],
    playbook: [
      { h: 'Pick the tone furthest from your subject', d: 'Deadly serious topic → nursery rhyme. Boring topic → epic. The distance between tone and content is where attention lives.' },
      { h: 'Write the song first', d: 'Musical formats travel because people re-listen. If the track is not good enough to hear twice, do not shoot.' },
      { h: 'Make it modular', d: 'Build the middle as a list of independent gags so any fragment stands alone on a social feed.' },
      { h: 'Hide the message at 80%', d: 'Deliver the actual ask once, late, in the same tone as the comedy. Never break voice to be earnest.' },
      { h: 'Give it somewhere to go next', d: 'This became a game and a ringtone. Plan the second surface before launch.' }
    ],
    kit: ['A songwriter', 'A simple, cloneable character style', 'Animator or motion designer', '20–30 gag ideas to cut down to 12'],
    trap: 'Getting the comedy right and then breaking tone to lecture. The moment you switch to a serious voiceover, the shareability dies.',
    cost: 'Reported around AU$200k — most of it animation. Music and writing were the value, not the render.',
    query: 'Dumb Ways to Die Metro Trains Melbourne'
  },
  {
    id: 'turkish-kobe-messi',
    brand: 'Turkish Airlines',
    title: 'Kobe vs. Messi: The Selfie Shootout',
    year: 2012,
    views: '~145M',
    viewsNum: 145,
    category: 'comedy',
    budget: 'blockbuster',
    runtime: '2:00',
    formula: 'one-take-stunt',
    poster: { c1: '#E11D48', c2: '#0C0B0E', motif: 'orbit' },
    hook: 'Two of the most famous athletes alive, escalating a petty selfie contest across the planet.',
    why: 'The brand had one genuinely interesting asset: it flies almost everywhere. Rather than state that, they turned the route map into the plot — every escalation is a new country — so the product benefit is what the story is physically made of.',
    beats: [
      { t: '0:00', label: 'Two icons, one small human motive', desc: 'Global superstars reduced to a childish rivalry. Instantly legible in any language.' },
      { t: '0:25', label: 'Escalation loop', desc: 'Each tries to out-do the other in a new location. The structure can absorb any number of beats.' },
      { t: '1:30', label: 'The wildcard', desc: 'A third party trumps them both. The joke lands on someone the audience did not expect.' },
      { t: '1:50', label: 'Benefit as punchline', desc: 'The route network is the reason the whole thing was possible.' }
    ],
    playbook: [
      { h: 'Find the benefit that has a plot in it', d: 'Reach, speed, size, range — anything that changes location or scale can be dramatised instead of stated.' },
      { h: 'Use a childish motive', d: 'Rivalry, envy, showing off. Universal motives translate across every market without a rewrite.' },
      { h: 'Build a loop, not a story', d: 'An escalation structure lets you add or cut beats to fit budget and runtime without breaking the film.' },
      { h: 'Let a third party win', d: 'The ending should transfer the joke to someone outside the rivalry — that is the beat people quote.' },
      { h: 'Cast for recognition, not for acting', d: 'The whole format runs on the audience already knowing who these people are within one second.' }
    ],
    kit: ['Two recognisable faces (local ones work)', 'Multiple distinct locations or convincing sets', 'A director who can hold a running gag', 'Serious talent budget'],
    trap: 'Buying fame and forgetting the mechanism. Two celebrities standing next to your product is not this format — the escalation is.',
    cost: 'Full agency production with two global sports stars. The structure, however, works with two mildly famous local faces.',
    query: 'Turkish Airlines Kobe Messi selfie shootout ad'
  },
  {
    id: 'volvo-split',
    verified: true,
    videoId: 'M7FIvfx5J10',
    thumb: 'https://i.ytimg.com/vi/M7FIvfx5J10/maxresdefault.jpg',
    brand: 'Volvo Trucks',
    title: 'The Epic Split',
    year: 2013,
    views: '~115M',
    viewsNum: 115,
    category: 'stunt',
    budget: 'blockbuster',
    runtime: '1:16',
    formula: 'one-take-stunt',
    poster: { c1: '#0EA5A0', c2: '#0C0B0E', motif: 'split' },
    hook: 'Jean-Claude Van Damme does the splits between two reversing trucks. One shot. No cuts.',
    why: 'The product claim was dynamic steering stability — a spec nobody reads. They turned the spec into a physical stunt that only works if the spec is true, so watching the stunt <em>is</em> reading the spec.',
    beats: [
      { t: '0:00', label: 'Silence and a claim', desc: 'White text on black, no logo, no music yet. The restraint reads as confidence.' },
      { t: '0:08', label: 'The body enters', desc: 'A recognisable face in a position that could visibly go wrong live.' },
      { t: '0:52', label: 'The impossible held shot', desc: 'The unbroken take is the proof. Cut here and the whole film becomes a claim again.' },
      { t: '1:10', label: 'Payoff = spec', desc: 'A single line explains that the stunt was only possible because of the engineering being sold.' }
    ],
    playbook: [
      { h: 'Translate a spec into a physical risk', d: 'Ask: what could a person do, on camera, that only works if this spec is real? That question is the whole format.' },
      { h: 'Open with restraint', d: 'No music, no logo, minimal text. Loud openings signal "ad" and get skipped; quiet ones signal "something is about to happen".' },
      { h: 'Protect the unbroken take', d: 'Rehearse for days so you can shoot without a cut. The credibility lives entirely in the absence of edits.' },
      { h: 'Cast for physical credibility', d: 'The performer must plausibly be able to do the thing. A stand-in whose face you never see kills it.' },
      { h: 'Close on the mechanism', d: 'One line, at the end, connecting stunt to spec. Never explain during the stunt.' }
    ],
    kit: ['A spec worth proving', 'A stunt coordinator and real safety plan', 'Long-lens camera, golden-hour window', 'Rehearsal days, not rehearsal hours'],
    trap: 'Stunts that would work with anyone\'s product. If a competitor could run your film with their logo on the end, you have not proved anything.',
    cost: 'Blockbuster. But the underlying move — one take, real risk, spec as payoff — has been executed for a few thousand with a bicycle.',
    query: 'Volvo Trucks Epic Split Van Damme'
  },
  {
    id: 'always-likeagirl',
    brand: 'Always',
    title: '#LikeAGirl',
    year: 2014,
    views: '~70M',
    viewsNum: 70,
    category: 'experiment',
    budget: 'blockbuster',
    runtime: '3:18',
    formula: 'social-experiment',
    poster: { c1: '#D6407F', c2: '#0C0B0E', motif: 'burst' },
    hook: 'Adults are asked to run "like a girl". Then young girls are asked the same thing — and do it completely differently.',
    why: 'It found a phrase the audience uses without thinking, then showed them, on camera, what it does. The insight is not stated by a voiceover; the audience derives it from watching two groups answer the same prompt.',
    beats: [
      { t: '0:00', label: 'The prompt', desc: 'A simple instruction given to adults on a casting stage. No context, no music cue.' },
      { t: '0:45', label: 'The pattern', desc: 'Enough adults perform the parody that the viewer clocks it as normal.' },
      { t: '1:35', label: 'The break', desc: 'The same prompt to young girls, who do it sincerely and fast. The contrast does the argument.' },
      { t: '2:30', label: 'The realisation on camera', desc: 'Earlier participants are asked to reconsider. Watching someone change their mind is the emotional payload.' },
      { t: '3:05', label: 'Reframe the phrase', desc: 'The brand claims the phrase rather than selling a product feature.' }
    ],
    playbook: [
      { h: 'Find a phrase, not a topic', d: 'The format needs a specific line people say automatically. Vague issues produce vague films.' },
      { h: 'Design one prompt, two groups', d: 'The entire structure is a single instruction given to two populations whose answers differ. Nothing else is required.' },
      { h: 'Cast real, brief nobody', d: 'Participants must not know the thesis. Coached reactions are visible and destroy the film.' },
      { h: 'Film the reconsideration', d: 'The strongest 20 seconds are always someone realising what they just did. Plan a second sitting to capture it.' },
      { h: 'Earn the right to speak', d: 'Only take the position if the brand can be held to it afterwards. This format invites scrutiny of the sponsor.' }
    ],
    kit: ['A casting call that hides the thesis', 'A neutral stage and two cameras', 'Signed releases for real participants', 'An interviewer who will not lead'],
    trap: 'Manufacturing the reaction. If it looks cast and scripted, the format inverts and you get a backlash reel instead of a share.',
    cost: 'Agency-scale, but the shooting core — a stage, two cameras, and real people — is genuinely cheap. The research and legal work are the real spend.',
    query: 'Always Like A Girl campaign film'
  },
  {
    id: 'dove-sketches',
    brand: 'Dove',
    title: 'Real Beauty Sketches',
    year: 2013,
    views: '~70M',
    viewsNum: 68,
    category: 'experiment',
    budget: 'blockbuster',
    runtime: '3:00',
    formula: 'social-experiment',
    poster: { c1: '#3B82C4', c2: '#0C0B0E', motif: 'wave' },
    hook: 'A forensic artist draws each woman twice: once from her own description, once from a stranger\'s.',
    why: 'It engineered a moment where the audience discovers the point at the same second the participant does — the two portraits side by side. The "aha" is visual and instant, which is why it survived translation into dozens of markets.',
    beats: [
      { t: '0:00', label: 'Unexplained setup', desc: 'A sketch artist behind a curtain. The viewer wants to know the rules, which buys 40 seconds.' },
      { t: '0:50', label: 'Round one', desc: 'Participants describe themselves. Their language is quietly harsh; nobody comments on it.' },
      { t: '1:40', label: 'Round two', desc: 'Strangers describe the same people, warmly. The audience is now ahead of the participants.' },
      { t: '2:20', label: 'The reveal', desc: 'Both sketches shown together. Nothing is explained — the image is the argument.' },
      { t: '2:50', label: 'One line', desc: 'A short claim, then the brand. No product demonstration at all.' }
    ],
    playbook: [
      { h: 'Build a mechanism, not a message', d: 'This works because of a procedure that produces a comparison. Design the procedure and the emotion is automatic.' },
      { h: 'Withhold the rules', d: 'Let the viewer spend the first minute working out what the experiment is. Curiosity is cheaper than production value.' },
      { h: 'Put the reveal in one frame', d: 'The payoff must be a single image a viewer can screenshot. That frame is what actually gets shared.' },
      { h: 'Let participants speak, cut the narrator', d: 'No voiceover explains this film. Anything you explain, you weaken.' },
      { h: 'Pressure-test the thesis', d: 'This format attracts critique of the premise. Have an honest answer before launch, not after.' }
    ],
    kit: ['A procedure that produces a contrast', 'An expert who is not an actor', 'Documentary crew, two cameras', 'Time — the setup takes longer than the shoot'],
    trap: 'Confusing a sad story with an experiment. Without a procedure and a comparison, you have a testimonial reel.',
    cost: 'Agency-scale, but the shoot itself is a room, an artist, and a curtain.',
    query: 'Dove Real Beauty Sketches film'
  },
  {
    id: 'old-spice',
    verified: true,
    videoId: 'owGykVbfgUE',
    thumb: 'https://i.ytimg.com/vi/owGykVbfgUE/maxresdefault.jpg',
    brand: 'Old Spice',
    title: 'The Man Your Man Could Smell Like',
    year: 2010,
    views: '~60M',
    viewsNum: 60,
    category: 'comedy',
    budget: 'blockbuster',
    runtime: '0:33',
    formula: 'founder-monologue',
    poster: { c1: '#14B8A6', c2: '#0C0B0E', motif: 'orbit' },
    hook: '"Hello ladies. Look at your man. Now back to me."',
    why: 'The buyer of men\'s body wash was frequently not the man. So the ad talks directly to her about him — and the impossible in-camera transitions gave people a reason to rewatch and work out how it was done.',
    beats: [
      { t: '0:00', label: 'Address the wrong person', desc: 'Direct-to-camera address to the purchaser, not the user. The misdirection is the joke and the strategy.' },
      { t: '0:08', label: 'Impossible continuity', desc: 'Shower to boat to horse in one apparent take. Practical, not post — which is why it reads as a trick worth replaying.' },
      { t: '0:25', label: 'Escalating absurdity', desc: 'Each claim outbids the last while the delivery stays completely deadpan.' },
      { t: '0:30', label: 'Product, held flat', desc: 'The pack is shown for a second and a half. No claim attached to it at all.' }
    ],
    playbook: [
      { h: 'Work out who actually buys', d: 'If the purchaser is not the user, address the purchaser. That single swap is most of the idea.' },
      { h: 'One performer, direct to lens', d: 'Confidence at the camera is the whole delivery. Cast a person who can hold a stare and land dry lines.' },
      { h: 'Engineer one impossible transition', d: 'A single practical set change mid-take gives viewers a reason to scrub back. One is enough.' },
      { h: 'Play it completely straight', d: 'The absurdity only works at a deadpan delivery. Any wink and it collapses into a sketch.' },
      { h: 'Keep the product beat short', d: 'Two seconds, no claim. The film earns the memory; the pack shot just names it.' }
    ],
    kit: ['One magnetic on-camera performer', 'A rehearsed practical set change', 'Tight script — every word counts at 33 seconds', 'Steadicam operator'],
    trap: 'Writing jokes instead of a voice. The format is a person, not a gag list — casting matters more than the script.',
    cost: 'Blockbuster, but the format scales down cleanly: one performer, one room, one transition.',
    query: 'Old Spice The Man Your Man Could Smell Like'
  },
  {
    id: 'squatty-potty',
    verified: true,
    videoId: 'YbYWhdLO43Q',
    thumb: 'https://i.ytimg.com/vi/YbYWhdLO43Q/maxresdefault.jpg',
    brand: 'Squatty Potty',
    title: 'This Unicorn Changed the Way I Poop',
    year: 2015,
    views: '~40M',
    viewsNum: 40,
    category: 'demo',
    budget: 'mid',
    runtime: '2:44',
    formula: 'absurd-demo',
    poster: { c1: '#8B5CF6', c2: '#0C0B0E', motif: 'burst' },
    hook: 'A prince explains colon posture while a unicorn dispenses rainbow soft-serve ice cream.',
    why: 'The product solves an unmentionable problem. A high-fantasy metaphor let the ad be graphic about the mechanism without being disgusting, which made it safe to share — and sharing was the only distribution the brand could afford.',
    beats: [
      { t: '0:00', label: 'Confess the taboo instantly', desc: 'The subject is named in the first line. No coyness, so no discomfort.' },
      { t: '0:20', label: 'Replace the gross with a metaphor', desc: 'A visual stand-in carries every subsequent demonstration.' },
      { t: '1:00', label: 'Actual anatomy lesson', desc: 'A real, correct explanation of the mechanism — the comedy bought permission for the science.' },
      { t: '2:00', label: 'Objection handling', desc: 'Price, looks, and "do I need this" answered in-character, at pace.' },
      { t: '2:30', label: 'Hard direct-response close', desc: 'Guarantee, price, and an unambiguous call to buy.' }
    ],
    playbook: [
      { h: 'Name the taboo in line one', d: 'Awkward products get more awkward when hedged. Saying it immediately removes the audience\'s discomfort.' },
      { h: 'Build one metaphor that does all the work', d: 'Pick a visual stand-in for the unshowable thing, then use it consistently for every demonstration.' },
      { h: 'Teach the actual mechanism', d: 'Comedy buys attention; the anatomy is what converts. Do not skip the explanation.' },
      { h: 'Answer objections in character', d: 'List the reasons people do not buy and script a line for each without dropping the voice.' },
      { h: 'Close hard', d: 'This is direct response, not brand film. Price, guarantee, and a clear instruction at the end.' }
    ],
    kit: ['A committed comic performer', 'One strong visual metaphor and the prop to sell it', 'A real objection list from customer service', 'A landing page that matches the film'],
    trap: 'Comedy with no mechanism. If viewers laugh but cannot explain what the product does, you get views and no orders.',
    cost: 'Mid — a specialist direct-response production. The metaphor, not the budget, is what people remember.',
    query: 'Squatty Potty unicorn ad Harmon Brothers'
  },
  {
    id: 'android-friends',
    brand: 'Android',
    title: 'Friends Furever',
    year: 2015,
    views: '~35M',
    viewsNum: 35,
    category: 'emotional',
    budget: 'mid',
    runtime: '1:01',
    formula: 'emotional-turn',
    poster: { c1: '#22C55E', c2: '#0C0B0E', motif: 'wave' },
    hook: 'A minute of unlikely animal friendships — a dog and a dolphin, an elephant and a sheep.',
    why: 'It was the most-shared ad of its year on almost no narrative at all. The brand line, "be together, not the same", is proved by clips rather than argued, and the clips are individually shareable, so the film had dozens of doors into it.',
    beats: [
      { t: '0:00', label: 'Charm with no setup', desc: 'Straight into the first pairing. No title card, no build.' },
      { t: '0:10', label: 'Rhythmic list', desc: 'A new pairing every three to five seconds, cut to music. The pace prevents boredom without any story.' },
      { t: '0:50', label: 'The line', desc: 'A four-word idea that reframes every clip you just watched as an argument.' },
      { t: '0:58', label: 'Logo', desc: 'One second. No product shown at any point in the film.' }
    ],
    playbook: [
      { h: 'Find a line your clips can prove', d: 'Write the brand idea first, then collect footage that is literally an example of it. Do not shoot then retrofit.' },
      { h: 'Cut to a list, not a story', d: 'Lists are immune to structural problems and easy to shorten for any placement.' },
      { h: 'Let the music carry structure', d: 'With no narrative, the track is the spine. Licence it before the edit, not after.' },
      { h: 'Hold the line to the end', d: 'The reframe only works if the audience watches innocently first.' },
      { h: 'Ship the fragments too', d: 'Every pairing is a standalone post. Plan the cut-downs in the same edit session.' }
    ],
    kit: ['A one-line brand idea', 'Licensed or commissioned footage', 'A music track cleared for paid use', 'An editor with rhythm'],
    trap: 'Charm with no idea. Without a line the clips prove, you have a compilation someone else already posted.',
    cost: 'Mid — largely licensing and edit time rather than production.',
    query: 'Android Friends Furever be together not the same'
  },
  {
    id: 'nike-dream-crazy',
    brand: 'Nike',
    title: 'Dream Crazy',
    year: 2018,
    views: '~30M',
    viewsNum: 30,
    category: 'manifesto',
    budget: 'blockbuster',
    runtime: '2:01',
    formula: 'manifesto',
    poster: { c1: '#F97316', c2: '#0C0B0E', motif: 'split' },
    hook: '"Believe in something. Even if it means sacrificing everything."',
    why: 'It accepted that half the audience would object, and treated that as the distribution plan rather than a risk to manage. The argument is built entirely from real athletes whose careers already prove the thesis, so it cannot be dismissed as copywriting.',
    beats: [
      { t: '0:00', label: 'Small, specific stories', desc: 'Individual athletes, named, each an unlikely case. Specific beats grand.' },
      { t: '0:40', label: 'Escalate the improbability', desc: 'Each example is harder to believe than the last, building toward the position.' },
      { t: '1:30', label: 'The line', desc: 'The argument is stated once, plainly, over a single face.' },
      { t: '1:50', label: 'No product', desc: 'A logo and a hashtag. The film never sells a shoe.' }
    ],
    playbook: [
      { h: 'Only take a position you can survive', d: 'This format is a commitment, not a campaign. If leadership will retreat under pressure, do not start.' },
      { h: 'Prove it with people, not adjectives', d: 'Real people whose lives already demonstrate the point. Every actor you cast weakens the argument.' },
      { h: 'Escalate, then state it once', d: 'Stack examples, then say the thesis a single time. Repeating it makes it a slogan.' },
      { h: 'Leave the product out', d: 'A manifesto that stops to sell reads as opportunism.' },
      { h: 'Plan for the objection', d: 'Draft the response to critics before launch. The reaction is part of the media plan.' }
    ],
    kit: ['A defensible position', 'Real people whose lives are the evidence', 'A voice that can carry two minutes', 'Executive sign-off in writing'],
    trap: 'Borrowing a cause with no standing. Audiences check whether the company behaves like the film, and the gap becomes the story.',
    cost: 'Blockbuster with athlete rights. The structure — real examples, one line, no product — costs nothing to borrow.',
    query: 'Nike Dream Crazy Colin Kaepernick ad'
  },
  {
    id: 'john-lewis-moon',
    brand: 'John Lewis',
    title: 'Man on the Moon',
    year: 2015,
    views: '~30M',
    viewsNum: 29,
    category: 'emotional',
    budget: 'blockbuster',
    runtime: '2:11',
    formula: 'emotional-turn',
    poster: { c1: '#60A5FA', c2: '#0C0B0E', motif: 'orbit' },
    hook: 'A girl with a telescope spots an old man living alone on the moon.',
    why: 'A retailer built an annual appointment out of a wordless short film. There is no product, no dialogue and no price — the store is positioned as the sponsor of a feeling, and the feeling is scheduled to arrive every November.',
    beats: [
      { t: '0:00', label: 'A question in one image', desc: 'A child looking at something. You need to know what she sees, so you stay.' },
      { t: '0:30', label: 'Failed attempts', desc: 'She tries and fails to reach him. Repetition builds investment cheaply.' },
      { t: '1:20', label: 'The gift arrives', desc: 'The solution is a small physical object — which is, quietly, the entire category the brand sells.' },
      { t: '1:50', label: 'Contact, not resolution', desc: 'The payoff is emotional, not narrative. Nothing is fixed; someone is simply seen.' },
      { t: '2:05', label: 'Line and logo', desc: 'A single sentence about giving. No products, no prices.' }
    ],
    playbook: [
      { h: 'Write it wordless', d: 'If it needs dialogue to work, it will not travel across markets. Test the story as silent storyboards.' },
      { h: 'One character with one impossible want', d: 'Simplicity is what allows two minutes without a plot.' },
      { h: 'Make the product the solution, never the subject', d: 'The object that resolves the story should be something you sell — shown, not named.' },
      { h: 'Licence a cover, not a hit', d: 'A slowed, stripped cover of a familiar song is the standard move because it signals emotion without cost of the original.' },
      { h: 'Commit to the calendar', d: 'This format compounds. One film is expensive; five years of films is an institution.' }
    ],
    kit: ['A wordless story', 'A music cover and clearance', 'Real production values — this format is unforgiving of cheapness', 'A multi-year commitment'],
    trap: 'Sentiment with no craft. Executed at 70% quality, this format reads as manipulative rather than moving.',
    cost: 'Blockbuster, and the media spend behind it usually exceeds production.',
    query: 'John Lewis Man on the Moon Christmas advert 2015'
  },
  {
    id: 'dollar-shave',
    verified: true,
    videoId: 'ZUG9qYTJMsI',
    thumb: 'https://i.ytimg.com/vi/ZUG9qYTJMsI/maxresdefault.jpg',
    brand: 'Dollar Shave Club',
    title: 'Our Blades Are F***ing Great',
    year: 2012,
    views: '~28M',
    viewsNum: 28,
    category: 'comedy',
    budget: 'garage',
    runtime: '1:33',
    formula: 'founder-monologue',
    poster: { c1: '#FACC15', c2: '#0C0B0E', motif: 'grid' },
    hook: 'The founder walks through his own warehouse explaining, deadpan, why razors cost too much.',
    why: 'A reported budget of about $4,500 and one day of shooting. The film works because the person talking is the person responsible — the credibility is free, and the warehouse behind him is the proof that the business exists.',
    beats: [
      { t: '0:00', label: 'Name and claim', desc: 'Who he is and what the offer is, inside eight seconds. No brand mood-setting.' },
      { t: '0:12', label: 'Attack the status quo', desc: 'Names the enemy — overpriced razors with pointless features. Specific, not generic.' },
      { t: '0:40', label: 'Walk-and-talk with jokes in the background', desc: 'One continuous walk through the real warehouse. Gags happen behind him while he keeps selling.' },
      { t: '1:10', label: 'Handle the objections', desc: 'Quality, shipping, cancellation — each answered in a single line.' },
      { t: '1:25', label: 'Ask for the order', desc: 'Direct instruction to subscribe. No ambiguity about the next step.' }
    ],
    playbook: [
      { h: 'Put the actual founder on camera', d: 'Not an actor. Authority is the format\'s only special effect, and it cannot be cast.' },
      { h: 'Script one continuous walk', d: 'A single unbroken walk through a real space is cheap, fast, and reads as honest. Rehearse the route.' },
      { h: 'Name a specific enemy', d: 'Not "the industry" — a named absurdity, like paying for a vibrating handle you did not want.' },
      { h: 'Put the jokes in the background', d: 'Sight gags behind the speaker let you be funny without interrupting the sell.' },
      { h: 'End with an instruction', d: 'One sentence: what to do, and what it costs. Do not fade out on a logo.' }
    ],
    kit: ['A founder who can hold a line', 'A real workplace to walk through', 'One camera operator with a gimbal', 'A tight 300-word script'],
    trap: 'A founder who cannot perform. If they are stiff on camera, this format exposes it in the first five seconds — switch to the demo structure instead.',
    cost: 'Reported at roughly $4,500 and a single day. This is the cheapest structure in the library.',
    query: 'Dollar Shave Club our blades are great original ad'
  },
  {
    id: 'geico-unskippable',
    brand: 'GEICO',
    title: 'Unskippable: Family',
    year: 2015,
    views: '~25M',
    viewsNum: 25,
    category: 'comedy',
    budget: 'blockbuster',
    runtime: '0:36',
    formula: 'pattern-interrupt',
    poster: { c1: '#38BDF8', c2: '#0C0B0E', motif: 'drop' },
    hook: 'The ad finishes its message in five seconds — then simply refuses to end.',
    why: 'It is built specifically for the skip button. The entire pitch lands before the skip becomes available, and everything after that is a joke about the fact that you are still watching, which is why people chose not to skip.',
    beats: [
      { t: '0:00', label: 'Complete the message immediately', desc: 'Brand, benefit and joke inside the unskippable five seconds. Nothing is held back for later.' },
      { t: '0:05', label: 'Acknowledge the format', desc: 'The film openly states that it is already over. Breaking the fourth wall is the hook.' },
      { t: '0:08', label: 'Freeze', desc: 'The actors hold completely still. The absurdity of the pause is what earns the rest of the runtime.' },
      { t: '0:20', label: 'Escalate inside the frozen frame', desc: 'A dog begins eating off the table. The joke grows without anyone moving.' }
    ],
    playbook: [
      { h: 'Design for the skip button', d: 'Assume five seconds is all you are guaranteed. Deliver brand and benefit inside it — every time.' },
      { h: 'Make the constraint the joke', d: 'Naming the format out loud converts an annoyance into a reason to keep watching.' },
      { h: 'Give the remaining time a reason to exist', d: 'Whatever happens after second five must be funnier than skipping. That is the actual creative brief.' },
      { h: 'Keep it one location, one set-up', d: 'The gag needs no coverage — a single frame is what makes the freeze legible.' },
      { h: 'Cut a five-second version too', d: 'The opening should stand alone as a bumper ad with no changes.' }
    ],
    kit: ['A single set and one camera position', 'Actors who can hold absolute stillness', 'One escalating background gag', 'A media plan built on pre-roll'],
    trap: 'Saving the brand for the end. If your name lands after second five, the skippers never see it and the format has done nothing for you.',
    cost: 'Agency-scale, but this is the most reproducible structure here — one room, one camera, one idea.',
    query: 'GEICO Unskippable family preroll ad'
  },
  {
    id: 'blendtec',
    verified: true,
    videoId: 'qg1ckCkm8YI',
    thumb: 'https://i.ytimg.com/vi/qg1ckCkm8YI/hqdefault.jpg',
    brand: 'Blendtec',
    title: 'Will It Blend? — iPhone',
    year: 2007,
    views: '~13M',
    viewsNum: 13,
    category: 'demo',
    budget: 'garage',
    runtime: '2:00',
    formula: 'absurd-demo',
    poster: { c1: '#EAB308', c2: '#0C0B0E', motif: 'grid' },
    hook: 'A man in a lab coat drops a brand-new iPhone into a blender and asks whether it will blend.',
    why: 'The founder reportedly started with a few dozen dollars of props and a format so repeatable it became a series. Each episode borrows the news cycle of whatever object goes in, so the ad is permanently tied to whatever people are already searching for.',
    beats: [
      { t: '0:00', label: 'Same opening every episode', desc: 'Identical set, identical greeting. Familiarity is what turns an ad into a show.' },
      { t: '0:15', label: 'Reveal today\'s victim', desc: 'The object is topical — whatever the internet is already talking about this week.' },
      { t: '0:45', label: 'The question', desc: '"Will it blend?" The viewer stays for an answer they cannot predict.' },
      { t: '1:20', label: 'Destruction', desc: 'Unbroken shot. The product is demonstrated by what it survives.' },
      { t: '1:50', label: 'Deadpan sign-off', desc: 'Smoke, a catchphrase, and no sales pitch whatsoever.' }
    ],
    playbook: [
      { h: 'Design a format, not a film', d: 'Something repeatable weekly beats one expensive shoot. Fix the set, the greeting and the sign-off, then vary only the object.' },
      { h: 'Borrow the news cycle', d: 'Choose subjects people are already searching for. Distribution comes free with the topic.' },
      { h: 'Ask a question in the title', d: 'A question people cannot answer is the cheapest click-through mechanism that exists.' },
      { h: 'Show the extreme, sell the ordinary', d: 'Destroying something absurd implies the everyday task is trivial. Never state that out loud.' },
      { h: 'Keep the host deadpan', d: 'The flatter the delivery, the funnier the destruction.' }
    ],
    kit: ['A fixed set you can re-shoot in an hour', 'A catchphrase', 'A weekly topical object', 'One camera, decent audio'],
    trap: 'Doing it once. This structure only compounds as a series — a single episode is a novelty with no back catalogue.',
    cost: 'Reported to have started around $50 in props. Genuinely the cheapest entry in this library.',
    query: 'Will It Blend iPhone Blendtec'
  }
];

/* ── The five principles ─────────────────────────────────── */
const PRINCIPLES = [
  {
    n: '01',
    h: 'The first three seconds contain a question',
    p: 'Not a logo, not a mood-setting drone shot. Every film here opens with something unresolved — a claim on black, a costumed stranger, an unexplained curtain — so the cheapest possible action becomes "wait one more second".',
    ev: { b: 'Sharpest example', t: 'Volvo opens on silence and one line of white text. No music, no logo, nothing to skip past.' }
  },
  {
    n: '02',
    h: 'The proof is physical, and the camera does not cut',
    p: 'Claims made in voiceover are free, and audiences price them accordingly. Claims made by something visibly happening in an unbroken shot cannot be faked, and the absence of an edit is what viewers actually read as evidence.',
    ev: { b: 'Sharpest example', t: 'Purple\'s eggs survive under 330 pounds in one continuous take. Cut it into three and the whole ad collapses.' }
  },
  {
    n: '03',
    h: 'It works with the sound off, and it works as a screenshot',
    p: 'Most views happen muted and half of them on a phone. The films that travelled all have a single frame that carries the idea by itself — that frame is what gets screenshotted, quoted and re-posted long after the video stops circulating.',
    ev: { b: 'Sharpest example', t: 'Dove\'s two sketches side by side. One image, whole argument, no audio required.' }
  },
  {
    n: '04',
    h: 'The product arrives last and stays short',
    p: 'Across this library the average time on the product is under five seconds, usually in the final beat. The film buys attention; the pack shot only has to name who bought it. Front-loading the product is the single most common reason branded video gets skipped.',
    ev: { b: 'Sharpest example', t: 'Nike never shows a shoe. Android never shows a phone. Both are unmistakably ads for exactly one company.' }
  },
  {
    n: '05',
    h: 'Someone had a specific reason to send it to one specific person',
    p: 'Views follow sends, and people send things to prove a point, to be funny in a group chat, or to say something they cannot say themselves. Ask who the sender is and what sending it says about them — if there is no answer, the media budget is doing all the work.',
    ev: { b: 'Sharpest example', t: 'Squatty Potty made an unmentionable subject safe to forward. That permission was the entire distribution strategy.' }
  }
];

/* ── Reusable structures for the brief builder ───────────── */
const FORMULAS = [
  {
    id: 'absurd-demo',
    name: 'Absurd demo',
    lineage: 'Purple · Squatty Potty · Blendtec',
    need: 'Works when you have one claim a camera can verify in a single shot.',
    hooks: [
      p => `We tested ${p.brand} the stupidest way we could think of.`,
      p => `${p.promise}. Here is what that looks like when you actually try it.`,
      p => `Nobody asked us to do this to ${p.product}. We did it anyway.`
    ],
    beats: [
      { w: 12, h: 'Absurd promise', d: p => `State the test out loud: “we are going to prove ${p.promise} — using something ridiculous.” Do not explain the product yet.` },
      { w: 20, h: 'Establish the stakes', d: () => 'Show the thing that can visibly break. The audience must be able to picture the mess before the test runs.' },
      { w: 28, h: 'Run the test — one take', d: () => 'Wide, locked-off, no cuts. The unbroken shot is the evidence. If you cut here, viewers assume a trick.' },
      { w: 22, h: 'Translate to the benefit', d: p => `One plain sentence connecting what just happened to ${p.audience}: “that is why ${p.promise}.”` },
      { w: 18, h: 'Close hard', d: p => `Price, guarantee, and a single instruction. Not a logo fade — tell them to buy ${p.product}.` }
    ],
    shots: [
      p => 'Wide master of the whole rig, tripod-locked, held from setup to result',
      p => 'One insert: close on the thing that could break, before the test',
      p => `Slow-motion pass of the moment of impact (shoot 120fps)`,
      p => `Direct-to-camera close-up for the translation line`,
      p => `Product on a clean surface, 2 seconds, for the close`
    ],
    trap: 'Loving the stunt more than the sell. If a viewer cannot say what your product does after watching, you made a magic trick.',
    checks: [
      p => `Ask five strangers to watch it muted, then describe ${p.product}. If they cannot, the translation beat is too short.`,
      () => 'Confirm nothing in the test is faked. One comment thread proving a rig existed erases the whole campaign.',
      () => 'Shoot the test twice. The first take is always technically fine and emotionally flat.'
    ]
  },
  {
    id: 'founder-monologue',
    name: 'Direct-address monologue',
    lineage: 'Dollar Shave Club · Old Spice',
    need: 'Cheapest structure here. Needs one person with real authority who is watchable on camera.',
    hooks: [
      p => `Hi, I'm the person who makes ${p.product}. Here is why it costs what it costs.`,
      p => `Everyone selling ${p.product} is lying to you about one thing.`,
      p => `${p.promise}. I'll show you the room where we do it.`
    ],
    beats: [
      { w: 10, h: 'Name and claim', d: p => `Who you are and what the offer is, inside the first eight seconds. “I'm ___ from ${p.brand}, and ${p.promise}.”` },
      { w: 20, h: 'Name a specific enemy', d: p => `Not “the industry” — one named absurdity that ${p.audience} already resent paying for.` },
      { w: 30, h: 'Walk the real space', d: p => `One continuous walk through where ${p.product} actually gets made. Rehearse the route so the talk never stops.` },
      { w: 22, h: 'Objections, one line each', d: () => 'Quality, price, shipping, cancellation. Every doubt gets a single sentence, no hedging.' },
      { w: 18, h: 'Ask for the order', d: p => `One instruction: what to do next and what it costs. Do not fade out on a logo.` }
    ],
    shots: [
      () => 'Gimbal walking master, one continuous take through the real workspace',
      () => 'Background sight gags — staged, but never acknowledged by the speaker',
      () => 'Two static cutaways for safety, matched to the walking exposure',
      p => `One handheld close for the objection block`,
      () => 'Final direct-to-lens for the instruction'
    ],
    trap: 'A founder who freezes on camera. This format exposes stiffness in five seconds — if the rehearsal is painful, switch structures.',
    checks: [
      () => 'Rehearse the walk five times before rolling. The route is the script.',
      () => 'Keep the whole script under 300 words for 90 seconds of runtime.',
      p => `Have someone outside the company read the enemy line. If it sounds like a complaint rather than a joke, rewrite it.`
    ]
  },
  {
    id: 'one-take-stunt',
    name: 'One-take stunt',
    lineage: 'Volvo Trucks · Turkish Airlines',
    need: 'For a spec nobody reads. You need a real safety plan and rehearsal days, not rehearsal hours.',
    hooks: [
      p => `A single line on black: “${p.promise}.” Then nothing but the stunt.`,
      p => `We asked someone to trust ${p.product} with something they could not fake.`,
      p => `No cuts. No effects. One take, one chance.`
    ],
    beats: [
      { w: 10, h: 'Silence and a claim', d: p => `White text on black: “${p.promise}.” No logo, no music. Restraint reads as confidence.` },
      { w: 18, h: 'The body enters', d: () => 'A person in a position that could visibly go wrong. Their face must be visible — a stand-in kills it.' },
      { w: 38, h: 'Hold the shot', d: () => 'No cut, no cutaway, no insert. The unbroken take is the entire proof. Protect it in the edit.' },
      { w: 16, h: 'Payoff = mechanism', d: p => `One line: this only worked because of ${p.promise}. Never explain during the stunt.` },
      { w: 18, h: 'Logo, two seconds', d: p => `${p.brand}, held flat. Nothing else.` }
    ],
    shots: [
      () => 'Long-lens locked master — the take that is the ad',
      () => 'Second camera at 90° as insurance only (never cut to it)',
      () => 'Golden-hour window: plan for two attempts per day, maximum',
      () => 'Drone establishing plate for the opening text card',
      () => 'Safety rehearsal footage — useful as a making-of asset'
    ],
    trap: 'A stunt that would work with a competitor\'s product on the end card. If it is transferable, it proves nothing.',
    checks: [
      () => 'Write the one-line mechanism payoff before you design the stunt. If you cannot, the stunt is decoration.',
      () => 'Budget the safety plan first. Insurance and a stunt coordinator are not optional line items.',
      () => 'Agree in writing that nobody may add a cut in post to "improve the pacing".'
    ]
  },
  {
    id: 'social-experiment',
    name: 'Social experiment',
    lineage: 'Always #LikeAGirl · Dove Real Beauty Sketches',
    need: 'Needs a procedure that produces a contrast — and real participants who do not know the thesis.',
    hooks: [
      p => `We gave the same instruction to two groups of ${p.audience}. They answered completely differently.`,
      p => `Nobody in this room knew what we were testing.`,
      p => `We asked people to describe ${p.product} twice. Once alone, once to a stranger.`
    ],
    beats: [
      { w: 14, h: 'Unexplained setup', d: () => 'Show the apparatus without explaining the rules. Curiosity buys you the first 40 seconds for free.' },
      { w: 26, h: 'Group one', d: p => `Run the prompt with the first group of ${p.audience}. Do not comment on their answers.` },
      { w: 26, h: 'Group two', d: () => 'Same prompt, different group. The contrast makes the argument — no voiceover required.' },
      { w: 20, h: 'The reveal in one frame', d: () => 'Put both results side by side in a single screenshot-able image. That frame is what gets shared.' },
      { w: 14, h: 'One line, then brand', d: p => `A single sentence from ${p.brand}. No product demonstration at all.` }
    ],
    shots: [
      () => 'Two-camera documentary setup: wide two-shot plus tight on the participant',
      () => 'Clean plate of the apparatus, unexplained, for the opening',
      () => 'The comparison frame — light it properly, it is the whole ad',
      () => 'Reaction sitting: bring participants back to see the result',
      () => 'Room tone and clean audio — you will have no music bed to hide behind'
    ],
    trap: 'Manufacturing the reaction. Coached participants are visible, and the format inverts into a backlash reel.',
    checks: [
      p => `Write the casting call so it hides the thesis. Participants who guess it are unusable.`,
      () => 'Get signed releases before anyone speaks, and a second release after they see the result.',
      p => `Ask whether ${p.brand} can be held to this position for three years. If not, do not run it.`
    ]
  },
  {
    id: 'emotional-turn',
    name: 'Emotional turn',
    lineage: 'Dumb Ways to Die · John Lewis · Android',
    need: 'Works when the product is boring but the context is not. Unforgiving of low craft.',
    hooks: [
      p => `Open on something charming that has nothing obvious to do with ${p.product}.`,
      p => `One character, one impossible want, no dialogue.`,
      p => `Play it sweet for ninety seconds, then name what it was about.`
    ],
    beats: [
      { w: 14, h: 'A question in one image', d: () => 'Someone looking at something we cannot see yet. Wordless. No title card, no logo.' },
      { w: 30, h: 'Repetition builds investment', d: () => 'Failed attempts, or a rhythmic list. Repetition is the cheapest way to make people care without plot.' },
      { w: 22, h: 'The small solution', d: p => `The thing that resolves it is quietly the category ${p.brand} sells. Shown, never named.` },
      { w: 20, h: 'The turn', d: p => `Reframe everything just watched: the film was about ${p.promise} all along.` },
      { w: 14, h: 'One line, one logo', d: () => 'A single sentence. No products, no prices, no voiceover explaining the feeling.' }
    ],
    shots: [
      () => 'Silent storyboard test — if it does not read without dialogue, rewrite before shooting',
      () => 'Music-led edit: licence the track before the edit, not after',
      () => 'One hero frame for the turn, treated as a poster',
      () => 'Cut-downs planned in the same session: 6s, 15s, 30s',
      () => 'Real production values — this format punishes cheapness harder than any other'
    ],
    trap: 'Sentiment without craft. At 70% execution this format reads as manipulative rather than moving.',
    checks: [
      () => 'Watch it muted. If the story disappears, the film is a radio ad with pictures.',
      () => 'Clear music rights for paid social, not just organic. This is the most common launch delay.',
      p => `Confirm that ${p.brand} will run this format again next year. One-offs from this structure rarely pay back.`
    ]
  },
  {
    id: 'pattern-interrupt',
    name: 'Skip-button interrupt',
    lineage: 'GEICO Unskippable',
    need: 'Built for pre-roll. The most reproducible structure here — one room, one camera, one idea.',
    hooks: [
      p => `${p.brand}. ${p.promise}. That's the whole ad — you can't skip it, it's already over.`,
      p => `You have five seconds before you can skip. Here is everything.`,
      p => `This ad about ${p.product} ends now. The next 25 seconds are just for fun.`
    ],
    beats: [
      { w: 14, h: 'Complete the message', d: p => `Brand, benefit and joke inside five seconds: “${p.brand} — ${p.promise}.” Hold nothing back.` },
      { w: 12, h: 'Acknowledge the format', d: () => 'Say out loud that the ad is already finished. Breaking the fourth wall is the hook.' },
      { w: 14, h: 'Freeze', d: () => 'Everyone in frame holds absolutely still. The absurd pause is what earns the rest of the runtime.' },
      { w: 40, h: 'Escalate inside the frozen frame', d: p => `One background gag grows while nobody moves. It must be funnier than skipping — that is the real brief.` },
      { w: 20, h: 'Snap out', d: p => `Break the freeze on one beat, then straight to ${p.brand}.` }
    ],
    shots: [
      () => 'Single locked-off frame — no coverage, the static frame is the gag',
      () => 'Cast for stillness: audition people by asking them to hold a pose for 30 seconds',
      () => 'One background element that can escalate on its own (animal, machine, weather)',
      () => 'Shoot the 5-second bumper cut as its own take',
      () => 'Clean audio — the freeze means there is nowhere to hide a bad mix'
    ],
    trap: 'Saving the brand name for the end. Skippers never see it and the format has done nothing for you.',
    checks: [
      p => `Cut a 5-second version first. If it does not work alone, the structure is wrong for ${p.product}.`,
      () => 'Test on a phone, muted, with subtitles burned in. That is how most people will meet it.',
      () => 'Buy pre-roll placement specifically. This format is meaningless anywhere else.'
    ]
  }
];

const LENGTHS = [
  { id: 30, label: '30s' },
  { id: 60, label: '60s' },
  { id: 90, label: '90s' },
  { id: 150, label: '2:30' }
];
