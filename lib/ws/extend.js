/**
 * An old good trick
 */

module.exports = function(Child, Parent) {
   let Proxy = function() {};
   Proxy.prototype = Parent.prototype;
   Child.prototype = new Proxy();
   Child.prototype.constructor = Child;
   Child.superclass = Parent.prototype;
};
