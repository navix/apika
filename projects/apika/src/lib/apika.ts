import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {BehaviorSubject, distinctUntilChanged, filter, map, Observable, ReplaySubject, takeUntil} from 'rxjs';
import {ApikaPage} from './apika-page';

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
    const obs = this.#http
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
    return obs;
  }

  createReqHandler<NAME extends keyof CONTROLLERS>(controller: NAME) {
    const page = inject(ApikaPage, {optional: true, self: true});
    return new ApikaReqHandler<CONTROLLERS, NAME>(controller, this, page || undefined);
  }
}

export type ApikaReqHandlerStatus = 'New' | 'Ongoing' | 'Succeed' | 'Failed';

export class ApikaReqHandler<CONTROLLERS extends Controllers<any, any>, NAME extends keyof CONTROLLERS> {
  #state$ = new BehaviorSubject<
    {status: 'New'} |
    {status: 'Ongoing'} |
    {status: 'Succeed'; data: Awaited<ReturnType<CONTROLLERS[NAME]>>} |
    {status: 'Failed'; error: any}
  >({status: 'New'});

  constructor(
    public readonly command: NAME,
    private api: Apika<CONTROLLERS>,
    private page?: ApikaPage,
  ) {
    if (this.page) {
      this.page.destroy$.subscribe(() => {
        this.#state$.complete();
      });
    }
  }

  get state() {
    return this.#state$.value;
  }

  get state$() {
    return this.#state$.asObservable();
  }

  get status(): ApikaReqHandlerStatus {
    return this.state.status;
  }

  get status$(): Observable<ApikaReqHandlerStatus> {
    return this.state$.pipe(map(s => s.status));
  }

  get data(): Awaited<ReturnType<CONTROLLERS[NAME]>> | undefined {
    if (this.state.status === 'Succeed') {
      return this.state.data;
    } else {
      return undefined;
    }
  }

  get data$(): Observable<Awaited<ReturnType<CONTROLLERS[NAME]>>> {
    return this.state$.pipe(
      filter(s => s.status === 'Succeed'),
      map((s: any) => s.data),
      distinctUntilChanged(),
    );
  }

  get ongoing() {
    return this.status === 'Ongoing';
  }

  get loaded() {
    return this.status === 'Succeed';
  }

  get succeed() {
    return this.status === 'Succeed';
  }

  run(body: Parameters<CONTROLLERS[NAME]>[0] = {} as any) {
    const subject = new ReplaySubject<Awaited<ReturnType<CONTROLLERS[NAME]>>>(1);
    this.#state$.next({status: 'Ongoing'});
    let obs = this.api.req(this.command, body);
    if (this.page) {
      obs = obs.pipe(takeUntil(this.page.destroy$));
    }
    obs.subscribe({
      next: res => {
        this.#state$.next({status: 'Succeed', data: res});
        subject.next(res);
        subject.complete();
      },
      error: error => {
        this.#state$.next({status: 'Failed', error});
        subject.error(error);
      },
    });
    return subject.asObservable();
  }
}
