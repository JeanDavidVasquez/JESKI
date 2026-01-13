import "../types";
import {expect} from "chai";
import * as sinon from "sinon";
import * as fftImport from "firebase-functions-test";
const fft = (fftImport as any).default ?? fftImport;
const test = fft();

describe("setUserRole", () => {
  let wrapped: any;

  before(async () => {
    const myFunctions = await import("../src/index");
    wrapped = test.wrap(myFunctions.setUserRole);
  });

  afterEach(() => {
    sinon.restore();
    delete (globalThis as any).__ADMIN_CLIENT_OVERRIDE__;
  });

  it("rejects if caller is not ADMIN", async () => {
    try {
      await wrapped({data: {email: "u@test", newRole: "PROVEEDOR"}, auth: {uid: "uid1", token: {role: "PROVEEDOR"}}, app: {appId: "test"}});
      throw new Error("Expected to throw");
    } catch (err: any) {
      expect(err.message).to.match(/permission-denied/i);
    }
  });

  it("assigns role and logs audit when called by ADMIN with App Check", async () => {
    const setClaimsFake = sinon.fake.resolves(undefined);
    const addFake = sinon.fake.resolves({});
    const collectionStub = sinon.stub().returns({add: addFake});

    (globalThis as any).__ADMIN_CLIENT_OVERRIDE__ = {
      auth: () => ({
        getUserByEmail: async (email: string) => ({uid: "tuid"}),
        setCustomUserClaims: setClaimsFake,
      }),
      firestore: () => ({collection: collectionStub}),
      FieldValue: {serverTimestamp: () => new Date()},
    } as any;

    const res = await wrapped({data: {email: "u@test", newRole: "PROVEEDOR"}, auth: {uid: "adminuid", token: {role: "ADMIN"}}, app: {appId: "test"}});
    expect(res).to.have.property("message").that.match(/Éxito!/i);
    expect(setClaimsFake.calledOnce).to.be.true;
    expect(collectionStub.calledWith("audit_logs")).to.be.true;
    expect(addFake.calledOnce).to.be.true;
  });
});
