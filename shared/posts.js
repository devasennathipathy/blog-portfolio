export const categories = ['Development', 'Design', 'Learning', 'Life'];
export const coverThemes = ['architecture', 'green', 'orange', 'blue', 'purple', 'sand'];

export const samplePosts = [
  {
    slug: 'building-for-the-web-with-a-little-more-intention',
    title: 'Building for the web, with a little more intention.',
    excerpt: 'Less noise. More purpose. A few things I’m learning about building digital experiences that feel good to use.',
    category: 'Development', tags: ['Web development', 'Craft', 'Perspective'],
    coverTheme: 'architecture', featured: true, status: 'published',
    publishedAt: '2026-10-28T09:00:00.000Z',
    content: `Good websites have a quiet confidence. They do what you came for, give you a little room to think, and get out of the way.

As I build more things for the web, I keep coming back to one question: **what does this actually help someone do?**

## Start with the smallest useful thing

Before choosing a framework or opening a design tool, I write down the job the page needs to do. A blog helps someone find an idea. A portfolio helps someone understand the work. An admin panel helps someone publish without getting lost.

That small sentence becomes a useful filter. When a feature doesn’t support it, I can save that feature for another day.

## Make the ordinary parts feel considered

Clear labels, readable type, and helpful error messages aren’t finishing touches. They’re the experience. The form should tell you what went wrong. The button should say what happens next. The empty state should offer a way forward.

> The details people rarely notice are often the details that make something easy to use.

## Build a little, then listen

Shipping a small working version teaches me more than polishing a large imaginary one. I can test the reading flow, check the page on my phone, and watch where someone hesitates.

For this journal, that means simple categories, a good reading experience, and a straightforward publishing workflow. The implementation can grow when the need becomes real.

## A practice, not a destination

I’m still learning how to do this well. Some days that means deleting code. Other days it means adding one thoughtful sentence to an error message. Both can make the product better.

My goal is to keep making things that feel a little more useful, a little more understandable, and a little more human.`,
  },
  {
    slug: 'a-component-is-a-conversation', title: 'A component is a conversation.',
    excerpt: 'What building a small React component library taught me about better boundaries and clearer decisions.',
    category: 'Development', tags: ['React', 'Components'], coverTheme: 'green', featured: false,
    status: 'published', publishedAt: '2026-10-21T09:00:00.000Z',
    content: `A reusable component is a small agreement between the person who makes it and the person who uses it. Its props are the vocabulary of that agreement.

## Name the intent

A button with a variant="primary" prop communicates more than a button with a dozen unrelated style switches. It gives the caller a choice that maps to the interface.

## Keep the state close

When a component owns a piece of state, that ownership should be easy to explain. A dialog can manage focus; the page should own whether the dialog is open. Keeping those responsibilities clear makes both pieces easier to test.

## Learn from repeated use

I wait for a pattern to repeat before extracting it. The second or third use usually reveals which details are essential and which were only specific to the first screen.

The best component API feels obvious because someone took the time to make the choices behind it clear.`,
  },
  {
    slug: 'making-space-for-the-important-things', title: 'Making space for the important things.',
    excerpt: 'A practical approach to whitespace, hierarchy, and letting your interfaces breathe.',
    category: 'Design', tags: ['UI design', 'Typography'], coverTheme: 'orange', featured: false,
    status: 'published', publishedAt: '2026-10-14T09:00:00.000Z',
    content: `Whitespace is one of the simplest ways to explain a page. It tells us which things belong together, where one thought ends, and what deserves our attention.

## Group before you decorate

Try arranging the page in black and white before adding color. Keep related labels and controls close. Give separate sections a larger gap. The structure should already be understandable.

## Choose a rhythm

A small spacing scale makes decisions easier. I tend to start with multiples of four and use larger jumps between sections. The exact numbers matter less than using them consistently.

## Check the small screen

Generous space on a desktop can become an obstacle on a phone. Review headings, cards, and forms at narrow widths. Keep room for comfortable touch targets, but avoid making readers scroll past decorative emptiness.

A good layout makes the next step feel natural. Space is one of the tools that helps it do that.`,
  },
  {
    slug: 'the-notes-i-wish-i-had-started-sooner', title: 'The notes I wish I had started sooner.',
    excerpt: 'How a simple learning journal became the most useful tool in my developer toolkit.',
    category: 'Learning', tags: ['Learning in public', 'Notes'], coverTheme: 'blue', featured: false,
    status: 'published', publishedAt: '2026-10-07T09:00:00.000Z',
    content: `I used to finish debugging something and immediately move on. A week later, I’d meet the same problem and start from scratch.

## Write down the question

My notes became more useful when I stopped recording only the answer. The question explains why the answer mattered. It also gives me words to search for later.

## Include one small example

A short working example beats a page of vague explanation. I keep the input, the expected output, and the detail that surprised me.

## Review what repeats

Every few weeks I look for recurring questions. Those are often signals of a concept I need to understand more deeply. Sometimes a note grows into an article; sometimes it stays a three-line reminder.

The point is to make tomorrow’s learning a little easier than today’s.`,
  },
  {
    slug: 'a-database-is-part-of-the-design', title: 'A database is part of the design.',
    excerpt: 'Thinking through documents, indexes, and the shape of a good publishing workflow.',
    category: 'Development', tags: ['MongoDB', 'Backend'], coverTheme: 'purple', featured: false,
    status: 'published', publishedAt: '2026-09-30T09:00:00.000Z',
    content: `The shape of your data influences what your application can do comfortably. For a blog, the most useful starting point is the reader’s path and the author’s workflow.

## Separate drafts from published work

A status field is simple, but it needs to be enforced in every public query. A draft shouldn’t become readable just because someone knows its slug.

## Index the questions you ask

The public feed asks for published posts sorted by publication date. The admin panel asks for everything sorted by its last update. Those are two different queries, and both deserve an index.

## Let the server own the rules

The browser can make forms pleasant, but the API must validate input, check identity, and enforce permissions. A hidden button is a helpful interface detail; it isn’t an access control.

Thinking about these rules early makes the finished experience feel more predictable.`,
  },
  {
    slug: 'stepping-away-to-see-it-differently', title: 'Stepping away to see it differently.',
    excerpt: 'On afternoon walks, unfinished side projects, and finding a more sustainable creative rhythm.',
    category: 'Life', tags: ['Process', 'Reflection'], coverTheme: 'sand', featured: false,
    status: 'published', publishedAt: '2026-09-23T09:00:00.000Z',
    content: `Some of my clearest decisions happen when I’m away from the screen. A short walk gives a difficult problem room to become a smaller one.

## Leave a breadcrumb

Before stopping, I write down the next useful step. It can be as simple as “check what the API returns when the list is empty.” That sentence makes returning to the work easier.

## Keep the project small enough to enjoy

Side projects don’t need to become companies. A useful tool, a small experiment, or a place to collect notes can be a worthwhile finish line.

## Return with a question

Instead of asking whether the work is good enough yet, I ask what would make it more useful. That question usually points to something concrete I can do next.

There is time to make things carefully. There is also time to close the laptop and let the ideas settle.`,
  },
];

export function readingTime(content) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}
