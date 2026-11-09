// The ready-made lessons and Talk sets, so the agent knows what it can reuse.
// The app's own copies, with their pictures, are in src/data/lessons.ts and
// src/data/talkSets.ts. If you add a ready-made lesson there, add it here too.
const COLOURS = ['Red', 'Blue', 'Yellow', 'Green', 'Orange', 'Purple', 'Pink', 'Brown'];
const ANIMALS = ['Dog', 'Cat', 'Cow', 'Duck', 'Fish', 'Rabbit', 'Elephant', 'Lion'];
const FRUITS = ['Apple', 'Banana', 'Orange', 'Grapes', 'Strawberry', 'Pear', 'Watermelon', 'Mango'];
const VEHICLES = ['Car', 'Bus', 'Train', 'Boat', 'Bike', 'Airplane', 'Truck', 'Helicopter'];

export const PRESET_LESSONS = [
  { refId: 'colours', title: 'Colours', words: COLOURS },
  { refId: 'animals', title: 'Animals', words: ANIMALS },
];

export const PRESET_TALK_SETS = [
  { refId: 'colours', title: 'Colours', words: COLOURS },
  { refId: 'animals', title: 'Animals', words: ANIMALS },
  { refId: 'fruits', title: 'Fruits', words: FRUITS },
  { refId: 'vehicles', title: 'Vehicles', words: VEHICLES },
];
