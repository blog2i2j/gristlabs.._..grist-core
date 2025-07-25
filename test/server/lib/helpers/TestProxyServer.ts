import {serveSomething, Serving} from "test/server/customUtil";
import * as express from "express";
import axios from "axios";

export class TestProxyServer {
  public static async Prepare(portNumber: number): Promise<TestProxyServer> {
    const server = new TestProxyServer(portNumber);
    await server._prepare();
    return server;
  }

  public get proxyCallCounter() { return this._proxyCallsCounter; }
  private _proxyCallsCounter: number = 0;
  private _proxyServing: Serving;

  private constructor(public readonly portNumber: number) {
  }

  public wasProxyCalled(): boolean {
    return this._proxyCallsCounter > 0;
  }

  public async dispose() {
    await this._proxyServing.shutdown();
  }

  private async _prepare() {
    this._proxyServing = await serveSomething(app => {
      app.use(express.json());
      app.all('*', async (req: express.Request, res: express.Response) => {
        this._proxyCallsCounter += 1;
        let responseCode;
        try {
          const axiosResponse = await axios.post(req.url, req.body);
          responseCode = axiosResponse.status;
        } catch (error: any) {
          responseCode = error.response.status;
        }
        res.sendStatus(responseCode);
        res.end();
      });
    }, this.portNumber);
  }
}
