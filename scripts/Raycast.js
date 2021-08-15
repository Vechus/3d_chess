var raycast = {
    dot: function (a, b) {
        return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n)
    },
    addVector: function (a, b){
    return a.map((e,i) => e + b[i]);
    },
    scaleVector: function (vec, s){
        return vec.map((e) => e * s);
    },

    // fast and easy algorithm for calculating the intersection between a plane and a line.
    // Note: the line cannot be coplanar with the plane
    linePlaneIntersection: function (planePoints, rayPoint1, rayDirection) {
        // l_a = rayPoint1
        // l_b = rayPoint2
        // l_ab = rayDir
        let rayPoint2 = this.addVector(rayDirection, rayPoint1);
        let rayDir = utils.subtractVectors(rayPoint2, rayPoint1);
        let planeDir01 = utils.subtractVectors(planePoints.p1, planePoints.p0);
        let planeDir02 = utils.subtractVectors(planePoints.p2, planePoints.p0);

        let planeCross = utils.cross(planeDir01, planeDir02);
        let numerator = this.dot(planeCross, utils.subtractVectors(rayPoint1, planePoints.p0));
        let denominator = this.dot(utils.subtractVectors([0, 0, 0], rayDir), planeCross);
        let t = numerator / denominator;
        return this.addVector(rayPoint1, this.scaleVector(rayDir, t));
    }
}
