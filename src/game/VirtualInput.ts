class VirtualInputClass {
  up = false;
  down = false;
  left = false;
  right = false;

  private _jump = false;
  private _attack = false;
  private _shoot = false;
  private _prevJump = false;
  private _prevAttack = false;
  private _prevShoot = false;

  pressJump()    { this._jump   = true;  }
  releaseJump()  { this._jump   = false; }
  pressAttack()  { this._attack = true;  }
  releaseAttack(){ this._attack = false; }
  pressShoot()   { this._shoot  = true;  }
  releaseShoot() { this._shoot  = false; }

  isJumpJustDown():   boolean { return this._jump   && !this._prevJump;   }
  isAttackJustDown(): boolean { return this._attack && !this._prevAttack; }
  isShootJustDown():  boolean { return this._shoot  && !this._prevShoot;  }

  endFrame(): void {
    this._prevJump   = this._jump;
    this._prevAttack = this._attack;
    this._prevShoot  = this._shoot;
  }
}

export const VirtualInput = new VirtualInputClass();
