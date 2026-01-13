import "../types";
import {expect} from "chai";
import * as sinon from "sinon";
import * as fftImport from "firebase-functions-test";
const fft = (fftImport as any).default ?? fftImport;
const test = fft();

describe("assignInitialRole", () => {
  let wrapped: any;

  before(async () => {
    const myFunctions = await import("../src/index");
    wrapped = test.wrap(myFunctions.assignInitialRole);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("rejects if App Check missing", async () => {
    try {
      await wrapped({data: {role: "PROVEEDOR"}, auth: {uid: "uid1"}});
      throw new Error("Expected to throw");
    } catch (err: any) {
      expect(err.message).to.match(/failed-precondition/i);
    }
  });

  it("assigns role when app present and no previous role", async () => {
    // Inyectamos un cliente fake mediante global override con spies para verificar invocaciones
    const setClaimsFake = sinon.fake.resolves(undefined);
    const addFake = sinon.fake.resolves({});
    const collectionStub = sinon.stub().returns({add: addFake});

    (globalThis as any).__ADMIN_CLIENT_OVERRIDE__ = {
      auth: () => ({
        getUser: async (uid: string) => ({customClaims: undefined}),
        setCustomUserClaims: setClaimsFake,
      }),
      firestore: () => ({collection: collectionStub}),
      FieldValue: {serverTimestamp: () => new Date()},
    } as any;

    const res = await wrapped({data: {role: "PROVEEDOR"}, auth: {uid: "uid1"}, app: {appId: "test"}});
    expect(res).to.have.property("message").that.match(/Rol PROVEEDOR asignado correctamente/);

    // Verificamos que setCustomUserClaims y escritura en audit_logs fueron invocadas
    expect(setClaimsFake.calledOnce).to.be.true;
    expect(collectionStub.calledWith("audit_logs")).to.be.true;
    expect(addFake.calledOnce).to.be.true;

    // Limpiamos override
    delete (globalThis as any).__ADMIN_CLIENT_OVERRIDE__;
  });
});
