export function sleep(delay: number = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, delay);
  });
}

export function validate(value: string, pattern: string | RegExp): boolean {
  let result = false;
  if (typeof pattern === 'string') {
    result = value === pattern;
  } else if (pattern instanceof RegExp) {
    result = pattern.test(value);
  }
  return result;
}