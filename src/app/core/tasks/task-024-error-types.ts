import type { TaskDefinition, TaskPrompt } from '../models/task.model';

const EXAMPLES = [
  {
    title: 'Stopwatch Reset',
    description:
      'During a reaction-time experiment, a student forgets to reset the stopwatch before one trial and starts timing while the previous time is still displayed.',
  },
  {
    title: 'Paper Airplane Distance',
    description:
      'Students measure how far paper airplanes travel outdoors. Light air currents vary from one flight to the next.',
  },
  {
    title: 'Spring Scale',
    description:
      'A spring scale has a bent pointer and consistently indicates 0.5 N more than the applied force.',
  },
  {
    title: 'Paper Bridge Strength',
    description:
      'When testing a paper bridge, students place coins in the center during some trials and near an edge during other trials.',
  },
  {
    title: 'Water Volume Reading',
    description:
      'Students read liquid volume in a graduated cylinder. Slight differences in viewing angle make the reading vary from trial to trial.',
  },
  {
    title: 'Plant Height',
    description:
      'Students measure seedling height, but leaves bend and the point to measure is difficult to judge consistently from trial to trial.',
  },
  {
    title: 'Dissolving Sugar',
    description:
      'While comparing how quickly sugar dissolves, a student stirs one sample for 10 seconds but forgets to stir the next sample.',
  },
  {
    title: 'Water Temperature',
    description:
      'A thermometer consistently reads 1.5 °C higher than the actual temperature.',
  },
  {
    title: 'Toy Car Ramp',
    description:
      'During a toy-car ramp experiment, a student gives the car a small push on some trials but releases it without a push on others.',
  },
  {
    title: 'Paper Towel Absorption',
    description:
      'After measuring one trial, students leave water in the tray before placing the next dry paper towel sample.',
  },
  {
    title: 'Light Intensity',
    description:
      'Students measure light beside a window while passing clouds cause the light level to rise and fall during testing.',
  },
  {
    title: 'Distance Measurement',
    description:
      'A tape measure has a damaged zero mark, so every distance measurement starts from a point 2 cm beyond the actual zero.',
  },
  {
    title: 'Pendulum Timing',
    description:
      'Students use a stopwatch to time 10 pendulum swings, and small differences in when they start and stop the timer occur across trials.',
  },
  {
    title: 'Sample Mass',
    description:
      'A balance reads 2 g when nothing is on it, and students use it for every measurement without adjusting it.',
  },
  {
    title: 'Plant Growth Data',
    description:
      'A student measures plant height in centimeters but records some values in the table as millimeters without converting them.',
  },
] as const;

function createExamplePrompts(
  title: string,
  index: number,
): TaskPrompt[] {
  return [
    {
      sectionHeader: `Example ${index + 1} — ${title}`,
      label: 'Error Type',
      type: 'choice',
      options: ['Random', 'Systematic', 'Procedural'],
      subLabel: 'Identify whether the error is random, systematic, or procedural.',
    },
    {
      label: 'Effect on Results',
      type: 'text',
      subLabel: 'Briefly describe how this error could affect the results.',
    },
  ];
}

export const TASK_024: TaskDefinition = {
  id: 'task-024-error-types',
  title: 'Error Type Identification Practice (Longer)',
  responseHeading:
    'For each example, identify whether the error is random, systematic, or procedural, then briefly describe how it could affect the results.',
  sectionInstructions: Object.fromEntries(
    EXAMPLES.map((example, index) => [
      `Example ${index + 1} — ${example.title}`,
      example.description,
    ]),
  ),
  prompts: EXAMPLES.flatMap((example, index) =>
    createExamplePrompts(example.title, index),
  ),
  dueDate: '',
  createdAt: '2026-11-12',
};
