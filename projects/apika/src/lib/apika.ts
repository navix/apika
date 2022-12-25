import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {BehaviorSubject, distinctUntilChanged, filter, map, Observable, ReplaySubject, Subject} from 'rxjs';

type Controllers<NAME extends string, FN> = Record<NAME, FN>;

@Injectable({
  providedIn: 'root',
})
export abstract class Apika<CONTROLLERS extends Controllers<any, any>> {
  #http = inject(HttpClient);

  abstract url: string;

  req<NAME extends keyof CONTROLLERS>(
    controller: NAME,
    body: Parameters<CONTROLLERS[NAME]>[0],
  ) {
    return this.#http
      .post<{success: true; result: Awaited<ReturnType<CONTROLLERS[NAME]>>} | {success: false; error: string}>(this.url + (controller as string), body)
      .pipe(
        map(res => {
          if (!res.success) {
            alert(res.error);
            throw new Error(res.error);
          }
          return res.result;
        }),
      );
  }

  createReqHandler<NAME extends keyof CONTROLLERS>(controller: NAME) {
    return new ApikaReqHandler<CONTROLLERS, NAME>(controller, this);
  }
}

export class ApikaReqHandler<CONTROLLERS extends Controllers<any, any>, NAME extends keyof CONTROLLERS> {
  #state$ = new BehaviorSubject<
    {state: 'New'} |
    {state: 'Ongoing'} |
    {state: 'Succeed'; data: Awaited<ReturnType<CONTROLLERS[NAME]>>} |
    {state: 'Failed'; error: any}
  >({state: 'New'});

  constructor(public readonly command: NAME, private api: Apika<CONTROLLERS>) {}

  get state() {
    return this.#state$.value;
  }

  get state$() {
    return this.#state$.asObservable();
  }

  get data() {
    if (this.state.state === 'Succeed') {
      return this.state.data;
    } else {
      return undefined;
    }
  }

  get data$() {
    return this.state$.pipe(
      map(s => s.state === 'Succeed' ? s.data : undefined),
      distinctUntilChanged(),
    );
  }

  get ongoing() {
    return this.state.state === 'Ongoing';
  }

  get loaded() {
    return this.state.state === 'Succeed';
  }

  get succeed() {
    return this.state.state === 'Succeed';
  }

  run(body: Parameters<CONTROLLERS[NAME]>[0] = {} as any) {
    const subject = new ReplaySubject<Awaited<ReturnType<CONTROLLERS[NAME]>>>(1);
    this.#state$.next({state: 'Ongoing'});
    this.api.req(this.command, body).subscribe({
      next: res => {
        this.#state$.next({state: 'Succeed', data: res});
        subject.next(res);
        subject.complete();
      },
      error: error => {
        this.#state$.next({state: 'Failed', error});
        subject.error(error);
      },
    });
    return subject.asObservable();
  }
}
