const Letters = "-ABCDEFGHIJKL-abcdefghijkl";

// Author: Lutz Tautenhahn, 2024, https://www.lutanho.net/
// Modified by me
class Noodle {
  constructor(oo, aa) {
    this.x3y = new Int8Array(64);
    this.o = oo;
    this.l = aa.length >> 1;
    let xx = [], yy = [], ii, jj, mm;
    let rr = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    for (jj = 0; jj < this.o; jj++) {
      xx[jj] = new Int8Array(16);
      yy[jj] = new Int8Array(16);
    }
    for (jj = 0; jj < this.o; jj++) {
      if (jj < 4) {
        for (ii = 0; ii < this.l; ii++) {
          xx[jj][ii] = rr[(jj + 0) % 4][0] * aa[2 * ii] + rr[(jj + 0) % 4][1] * aa[2 * ii + 1];
          yy[jj][ii] = rr[(jj + 1) % 4][0] * aa[2 * ii] + rr[(jj + 1) % 4][1] * aa[2 * ii + 1];
        }
      }
      else {
        for (ii = 0; ii < this.l; ii++) {
          xx[jj][ii] = rr[(jj + 1) % 4][0] * aa[2 * ii] + rr[(jj + 1) % 4][1] * aa[2 * ii + 1];
          yy[jj][ii] = rr[(jj + 0) % 4][0] * aa[2 * ii] + rr[(jj + 0) % 4][1] * aa[2 * ii + 1];
        }
      }
    }
    for (jj = 0; jj < this.o; jj++) {
      mm = 9999;
      for (ii = 0; ii < this.l; ii++) {
        if (mm > xx[jj][ii]) mm = xx[jj][ii];
      }
      for (ii = 0; ii < this.l; ii++) xx[jj][ii] -= mm;
      mm = 9999;
      for (ii = 0; ii < this.l; ii++) {
        if ((xx[jj][ii] == 0) && (mm > yy[jj][ii])) mm = yy[jj][ii];
      }
      for (ii = 0; ii < this.l; ii++) yy[jj][ii] -= mm;
      mm = 0;
      for (ii = 1; ii < this.l; ii++) {
        if ((xx[jj][ii] == 0) && (yy[jj][ii] == 0)) mm = ii;
      }
      if (mm > 0) {
        let tt = xx[jj][0];
        xx[jj][0] = xx[jj][mm];
        xx[jj][mm] = tt;
        tt = yy[jj][0];
        yy[jj][0] = yy[jj][mm];
        yy[jj][mm] = tt;
      }
      for (ii = 0; ii < this.l; ii++) this.x3y[(jj << 3) + ii] = (xx[jj][ii] << 3) + yy[jj][ii];
    }
  }
}

class NoodleSolver {
  constructor() {
    this.Next = new Int8Array(16);
    this.Prev = new Int8Array(16);
    this.IGrid = new Int8Array(128);
    this.Noodles = [];
    this.Solutions = "";
    this.SolutionCounter = 0;
    this.StartTime = new Date();
    this.NoodleSymOps = new Int8Array(16);
    this.NoodleRank = new Int8Array(16);
    this.NoodleOrder = new Int8Array(16);
    this.SymOps8Order = new Int8Array(16);
    this.SymOps4Order = new Int8Array(16);
  }

  Solve(ii0, jj0, rr) {
    let gg, xx3y, ii3j, ii, jj, ll, mm, mmn, mmp, oo, pp, qq, qql, qqo, nnxt = this.Next, pprv = this.Prev;
    gg = this.IGrid;
    ii = ii0;
    jj = jj0;
    while (gg[(ii << 3) + jj] > 0) {
      jj++;
      if (jj == 5) { ii++; jj = 0; }
      if (ii == 11) {
        this.SolutionCounter++;
        if (this.SolutionCounter > rr) return 1;
        this.Solutions += "#" + this.SolutionCounter + ":<br>";
        for (jj = 0; jj < 5; jj++) {
          for (ii = 0; ii < 11; ii++) {
            this.Solutions += Letters.charAt(gg[(ii << 3) + jj]);
          }
          this.Solutions += "<br>";
        }
        return 0;
      }
    }
    ii3j = (ii << 3) + jj;
    mm = nnxt[0];
    while (mm < 13) {
      qq = this.Noodles[mm - 1];
      qqo = qq.o;
      qql = qq.l;
      mmn = nnxt[mm];
      mmp = pprv[mm];
      pprv[mmn] = mmp;
      nnxt[mmp] = mmn;
      L: for (pp = 0; pp < qqo; pp++) {
        oo = pp << 3;
        if (rr < 0) {
          if (qqo == 4) oo = this.SymOps4Order[pp] << 3;
          if (qqo == 8) oo = this.SymOps8Order[pp] << 3;
        }
        xx3y = qq.x3y;
        for (ll = 1; ll < qql; ll++) {
          if (gg[xx3y[oo + ll] + ii3j] > 0) continue L;
        }
        for (ll = 0; ll < qql; ll++) gg[xx3y[oo + ll] + ii3j] = mm;
        if (this.Solve(ii, jj, rr)) return 1;
        for (ll = 0; ll < qql; ll++) gg[xx3y[oo + ll] + ii3j] = 0;
      }
      nnxt[mmp] = pprv[mmn] = mm;
      mm = mmn;
    }
    return 0;
  }

  Init(tt, rr) {
    let ii, jj, nn, ss = "-ABCDEFGHIJKL-abcdefghijkl", aa = tt.split(",");
    let oo = this.NoodleOrder;
    this.Solutions = "";
    this.SolutionCounter = 0;
    this.InitArray(this.SymOps8Order, 0, 8, rr);
    this.InitArray(this.SymOps4Order, 0, 4, rr);
    this.InitArray(oo, 0, 12, rr);
    for (ii = 0; ii < 12; ii++) this.NoodleRank[oo[ii]] = ii;
    for (ii = 0; ii < 5; ii++) this.NoodleSymOps[oo[ii]] = 8;
    for (ii = 5; ii < 9; ii++) this.NoodleSymOps[oo[ii]] = 4;
    for (ii = 9; ii < 10; ii++) this.NoodleSymOps[oo[ii]] = 2;
    for (ii = 10; ii < 12; ii++) this.NoodleSymOps[oo[ii]] = 1;
    this.Noodles[oo[0]] = new Noodle(8, [0, 0, 1, 0, 2, 0, 0, 1]);
    this.Noodles[oo[1]] = new Noodle(8, [0, 0, 1, 0, 2, 0, 0, 1, 1, 1]);
    this.Noodles[oo[2]] = new Noodle(8, [0, 0, 1, 0, 2, 0, 3, 0, 0, 1]);
    this.Noodles[oo[3]] = new Noodle(8, [0, 0, 1, 0, 2, 0, 3, 0, 1, 1]);
    this.Noodles[oo[4]] = new Noodle(8, [0, 0, 1, 0, 2, 0, 2, 1, 3, 1]);
    this.Noodles[oo[5]] = new Noodle(4, [0, 0, 1, 0, 0, 1]);
    this.Noodles[oo[6]] = new Noodle(4, [0, 0, 1, 0, 2, 0, 0, 1, 0, 2]);
    this.Noodles[oo[7]] = new Noodle(4, [0, 0, 1, 0, 1, 1, 2, 1, 2, 2]);
    this.Noodles[oo[8]] = new Noodle(4, [0, 0, 1, 0, 2, 0, 0, 1, 2, 1]);
    this.Noodles[oo[9]] = new Noodle(2, [0, 0, 1, 0, 2, 0, 3, 0]);
    this.Noodles[oo[10]] = new Noodle(1, [0, 0, 1, 0, 0, 1, 1, 1]);
    this.Noodles[oo[11]] = new Noodle(1, [1, 0, 0, 1, 1, 1, 2, 1, 1, 2]);
    for (ii = 0; ii < 16; ii++) this.Next[ii] = ii + 1;
    for (ii = 0; ii < 16; ii++) this.Prev[ii] = ii - 1;
    for (ii = 0; ii < 128; ii++) this.IGrid[ii] = 1;
    if (aa.length != 5) return 0;
    for (jj = 0; jj < 5; jj++) {
      if (aa[jj].length != 11) return 0;
    }
    for (jj = 0; jj < 5; jj++) {
      for (ii = 0; ii < 11; ii++) {
        nn = ss.indexOf(aa[jj].charAt(ii));
        if (nn <= 0) this.IGrid[(ii << 3) + jj] = 0;
        else {
          this.IGrid[(ii << 3) + jj] = oo[nn % 13 - 1] + 1;
          if (nn > 0) {
            nn = oo[nn % 13 - 1] + 1;
            if (this.Prev[this.Next[nn]] == nn) this.Prev[this.Next[nn]] = this.Prev[nn];
            if (this.Next[this.Prev[nn]] == nn) this.Next[this.Prev[nn]] = this.Next[nn];
          }
        }
      }
    }
    return 1;
  }

  InitArray(aa, ss, ll, rr) {
    let ii, jj, nn;
    for (nn = ss; nn < ss + ll; nn++) aa[nn] = nn;
    if (rr >= 0) return;
    for (nn = 0; nn < 2 * ll; nn++) {
      ii = Math.floor(Math.random() * ll);
      jj = aa[ss + nn % ll];
      aa[ss + nn % ll] = aa[ss + ii];
      aa[ss + ii] = jj;
    }
  }
}

export function startSolve(gridState, maxSolutions = -1) {
  let tt = "";
  for (let jj = 0; jj < 5; jj++) {
    if (jj > 0) tt += ",";
    for (let ii = 0; ii < 11; ii++) {
      tt += Letters.charAt(gridState[ii][jj]);
    }
  }

  const ss = new NoodleSolver();
  if (ss.Init(tt, maxSolutions)) {
    const rr = ss.Solve(0, 0, maxSolutions);
    if (rr) {
      const solvedGrid = [];
      for (let jj = 0; jj < 5; jj++) {
        solvedGrid[jj] = [];
        for (let ii = 0; ii < 11; ii++) {
          let oo = ss.IGrid[(ii << 3) + jj];
          if (oo > 0) oo = ss.NoodleRank[oo - 1] + 1;
          solvedGrid[jj][ii] = oo;
        }
      }
      return {
        solved: true,
        grid: solvedGrid,
      };
    } else {
      return {
        solved: false,
      };
    }
  } else {
    return {
      solved: false,
      message: "invalid input data :-(",
    };
  }
}