export class Observable {
  _subscribe;
  constructor(subscribe) {
    this._subscribe = subscribe;
  }

  // 接受多个参数的 pipe 实现
  pipe(...operations) {
    return operations.reduce((prev, fn) => fn(prev), this);
  }

  // 接受单个参数的 pipe 实现
  // pipe(operation) {
  //   return operation(this);
  // }

  subscribe(observer) {
    const defaultObserver = {
      next: () => { },
      error: () => { },
      complete: () => { }
    }
    if (typeof observer === 'function') {
      return this._subscribe({ ...defaultObserver, next: observer });
    } else {
      return this._subscribe({ ...defaultObserver, ...observer });
    }
  }
}

export function of(...args) {
  return new Observable(observer => {
    args.forEach(arg => {
      observer.next(arg);
    })
    observer.complete();
    return {
      unsubscribe: () => { }
    }
  })
}

export function fromEvent(element, event) {
  return new Observable(observer => {
    const handler = e => observer.next(e);
    element.addEventListener(event, handler);
    return {
      unsubscribe: () => element.removeEventListener(event, handler)
    };
  });
}

/**
 * @param param array or promise
 */
export function from(param) {
  if (Array.isArray(param)) {
    return new Observable(observer => {
      param.forEach(val => observer.next(val));
      observer.complete();
      return {
        unsubscribe: () => { }
      }
    });
  }
  return new Observable(observer => {
    let canceld = false;
    Promise.resolve(param)
      .then(val => {
        if (!canceld) {
          observer.next(val);
          observer.complete();
        }
      })
      .catch(e => {
        observer.error(e);
      });
    return {
      unsubscribe: () => { canceld = true }
    }
  })
}

export function interval(delay) {
  return new Observable(observer => {
    let index = 0;
    const time = setInterval((() => {
      observer.next(index++)
    }), delay)
    return {
      unsubscribe: () => clearInterval(time)
    }
  })
}

export function timer(delay) {
  return new Observable(observer => {
    const time = setTimeout((() => {
      observer.next(0)
    }), delay)
    return {
      unsubscribe: () => clearTimeout(time)
    }
  })
}

export function filter(fn) {
  return (observable) => (
    new Observable(observer => {
      observable.subscribe({
        next: val => fn(val) ? observer.next(val) : () => { },
        error: err => observer.error(err),
        complete: () => observer.complete(),
      })
    })
  )
}

export function map(fn) {
  return (observable) => (
    new Observable(observer => {
      observable.subscribe({
        next: val => observer.next(fn(val)),
        error: err => observer.error(err),
        complete: () => observer.complete(),
      })
    })
  )
}