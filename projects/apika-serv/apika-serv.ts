import {isPromise} from 'util/types';

type Controllers<NAME extends string, FN> = Record<NAME, FN>;

export class ApikaServ<NAME extends string, FN> {
  constructor(public controllers: Controllers<NAME, FN>) {}

  async handle({controller, body, ctx}: {controller: NAME; body: any; ctx: any}) {
    if (controller in this.controllers) {
      const method: any = this.controllers[controller as NAME];
      try {
        const res = method(body, ctx);
        return {
          success: true,
          result: isPromise(res) ? await res : res,
        };
      } catch (e: any) {
        return {
          success: false,
          error: e.message,
        };
      }
    }
    return {
      success: false,
      error: 'Command not found',
    };
  }
}
