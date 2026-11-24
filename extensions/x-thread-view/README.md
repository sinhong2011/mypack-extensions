# X Thread View

Opens a post and its nested replies full screen over the page, in X's own look and icons, without leaving where you
are: X's route, the page and your scroll stay.

- A post's 💬 count (or a click on the post) opens its replies. Writing a reply moves to a ↩ after the post's time.
- In a panel, a reply's 💬 opens its replies in a new panel on top; the one below steps back, and a breadcrumb shows the
  path. Back (or Esc) closes one level at a time.
- Panels rise from the bottom of the screen. A post starts loading while the pointer rests on it.
- "Go to reply" closes the panels and highlights the reply on the page. Photos open in a viewer over the panels.
- Follows X's light, dim and dark themes. ⌘/Ctrl-click opens a post the normal way.

## What it asks for

`@grant none`: no MyPack or GM functions. It runs on x.com and twitter.com only.

## How it gets its data

It sends the page's own `TweetDetail` GraphQL request again, with another post's id: the page's headers (its request
signature included) and sign-in, no API key, nothing leaving X (x.com and its api.x.com). It never changes the page's
route; if X refuses the request, the panel offers to open the post the normal way. The script keeps the last request it
saw (in x.com's local storage) for the next launch; until it has seen one, the first post you open opens X's way.

X changes its web app often: the 2026 redesign moved the API to `api.x.com`, reshaped its answers and dropped the
`data-testid` markup. The parser (`parseDetail`) reads both answer shapes and the page code both markups; expect to
update them from time to time. `x-thread-view.test.js` covers the parser:

```sh
node --test extensions/x-thread-view/x-thread-view.test.js
```
