import {Injectable, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable()
export class ApikaPage implements OnDestroy {
  #destroy$ = new Subject<void>();
  destroy$ = this.#destroy$.asObservable();

  ngOnDestroy() {
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
