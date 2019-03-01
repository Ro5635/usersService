/**
 * User Class
 *
 *
 */

class User {
    constructor(id, name, dashboards, subscriptions) {
        this.id = id;
        this.name = name;
        this.dashboards = dashboards;
        this.subscriptions = subscriptions;
    }

}


module.exports = User;