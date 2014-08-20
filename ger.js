// Generated by CoffeeScript 1.7.1
(function() {
  var GER, RET, Utils, knex, q,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  q = require('q');

  Utils = {
    flatten: function(arr) {
      return arr.reduce((function(xs, el) {
        if (Array.isArray(el)) {
          return xs.concat(Utils.flatten(el));
        } else {
          return xs.concat([el]);
        }
      }), []);
    },
    unique: function(arr) {
      var key, output, value, _i, _ref, _results;
      output = {};
      for (key = _i = 0, _ref = arr.length; 0 <= _ref ? _i < _ref : _i > _ref; key = 0 <= _ref ? ++_i : --_i) {
        output[arr[key]] = arr[key];
      }
      _results = [];
      for (key in output) {
        value = output[key];
        _results.push(value);
      }
      return _results;
    }
  };

  GER = (function() {
    function GER(esm) {
      var plural, v, _fn, _i, _len, _ref;
      this.esm = esm;
      this.weighted_probabilities_to_action_things_by_people = __bind(this.weighted_probabilities_to_action_things_by_people, this);
      this.probability_of_person_actioning_thing = __bind(this.probability_of_person_actioning_thing, this);
      this.get_list_to_size = __bind(this.get_list_to_size, this);
      this.INITIAL_PERSON_WEIGHT = 10;
      this.RESTRICTION_GET_PEOPLE_LIST = 300;
      this.RESTRICTION_PEOPLE_LIST = 200;
      this.RESTRICTION_SUBJECTS_LIST = 100;
      this.RESTRICTION_THINGS_LIST = 200;
      plural = {
        'person': 'people',
        'thing': 'things'
      };
      _ref = [
        {
          object: 'person',
          subject: 'thing'
        }, {
          object: 'thing',
          subject: 'person'
        }
      ];
      _fn = (function(_this) {
        return function(v) {
          _this["similar_" + plural[v.object] + "_for_action"] = function(object, action) {
            return _this.esm["get_" + plural[v.subject] + "_that_actioned_" + v.object](object, action).then(function(subjects) {
              subjects = subjects.slice(0, +_this.RESTRICTION_SUBJECTS_LIST + 1 || 9e9);
              return _this.esm["get_" + plural[v.object] + "_that_actioned_" + plural[v.subject]](subjects, action);
            }).then(function(objects) {
              return Utils.flatten(objects);
            }).then(function(objects) {
              return objects.filter(function(s_object) {
                return s_object !== object;
              });
            });
          };
          _this["similar_" + plural[v.object] + "_for_action_with_weights"] = function(object, action, weight) {
            return _this["similar_" + plural[v.object] + "_for_action"](object, action).then(function(objects) {
              var o, t, temp, _j, _len1;
              temp = [];
              for (_j = 0, _len1 = objects.length; _j < _len1; _j++) {
                o = objects[_j];
                t = {};
                t[v.object] = o;
                t.weight = weight;
                temp.push(t);
              }
              return temp;
            });
          };
          return _this["ordered_similar_" + plural[v.object]] = function(object) {
            return this.esm.get_ordered_action_set_with_weights().then((function(_this) {
              return function(action_weights) {
                var fn;
                fn = function(i) {
                  if (i >= action_weights.length) {
                    return q.fcall(function() {
                      return null;
                    });
                  } else {
                    return _this["similar_" + plural[v.object] + "_for_action_with_weights"](object, action_weights[i].key, action_weights[i].weight);
                  }
                };
                return _this.get_list_to_size(fn, 0, [], _this.RESTRICTION_GET_PEOPLE_LIST);
              };
            })(this)).then(function(object_weights) {
              var ow, p, r, res, temp, w, _j, _len1;
              temp = {};
              for (_j = 0, _len1 = object_weights.length; _j < _len1; _j++) {
                ow = object_weights[_j];
                if (temp[ow[v.object]] === void 0) {
                  temp[ow[v.object]] = 0;
                }
                temp[ow[v.object]] += ow.weight;
              }
              res = [];
              for (p in temp) {
                w = temp[p];
                if (p === object) {
                  continue;
                }
                r = {};
                r[v.object] = p;
                r.weight = w;
                res.push(r);
              }
              res = res.sort(function(x, y) {
                return y.weight - x.weight;
              });
              return res;
            });
          };
        };
      })(this);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        _fn(v);
      }
    }

    GER.prototype.get_list_to_size = function(fn, i, list, size) {
      if (list.length > size) {
        return q.fcall(function() {
          return list;
        });
      }
      return fn(i).then((function(_this) {
        return function(new_list) {
          if (new_list === null) {
            return q.fcall(function() {
              return list;
            });
          }
          new_list = list.concat(new_list);
          i = i + 1;
          return _this.get_list_to_size(fn, i, new_list, size);
        };
      })(this));
    };

    GER.prototype.probability_of_person_actioning_thing = function(object, action, subject) {
      return this.esm.has_person_actioned_thing(object, action, subject).then((function(_this) {
        return function(inc) {
          if (inc) {
            return 1;
          } else {
            return _this.esm.get_actions_of_person_thing_with_weights(object, subject).then(function(action_weights) {
              var as, _i, _len, _results;
              _results = [];
              for (_i = 0, _len = action_weights.length; _i < _len; _i++) {
                as = action_weights[_i];
                _results.push(as.weight);
              }
              return _results;
            }).then(function(action_weights) {
              return action_weights.reduce((function(x, y) {
                return x + y;
              }), 0);
            });
          }
        };
      })(this));
    };

    GER.prototype.weighted_probabilities_to_action_things_by_people = function(things, action, people_weights) {
      var p, people, people_keys, total_weight, total_weights, _i, _len;
      total_weights = 0;
      people = [];
      people_keys = {};
      for (_i = 0, _len = people_weights.length; _i < _len; _i++) {
        p = people_weights[_i];
        total_weights += p.weight;
        people.push(p.person);
        people_keys[p.person] = p.weight;
      }
      total_weight = ((function() {
        var _j, _len1, _results;
        _results = [];
        for (_j = 0, _len1 = people_weights.length; _j < _len1; _j++) {
          p = people_weights[_j];
          _results.push(p.weight);
        }
        return _results;
      })()).reduce(function(x, y) {
        return x + y;
      });
      return this.esm.events_for_people_action_things(people, action, things).then(function(events) {
        var e, normal_weights, thing, things_weight, weight, _j, _len1;
        things_weight = {};
        for (_j = 0, _len1 = events.length; _j < _len1; _j++) {
          e = events[_j];
          weight = people_keys[e.person];
          if (things_weight[e.thing] === void 0) {
            things_weight[e.thing] = 0;
          }
          things_weight[e.thing] += weight;
        }
        normal_weights = {};
        for (thing in things_weight) {
          weight = things_weight[thing];
          normal_weights[thing] = weight / total_weight;
        }
        return normal_weights;
      });
    };

    GER.prototype.recommendations_for_thing = function(thing, action) {
      return this.esm.get_people_that_actioned_thing(thing, action).then((function(_this) {
        return function(people) {
          var list_of_promises, p;
          list_of_promises = q.all((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = people.length; _i < _len; _i++) {
              p = people[_i];
              _results.push(this.ordered_similar_people(p));
            }
            return _results;
          }).call(_this));
          return q.all([people, list_of_promises]);
        };
      })(this)).spread((function(_this) {
        return function(people, peoples_lists) {
          var p, people_weights, ps, temp, _i, _j, _len, _len1;
          people_weights = Utils.flatten(peoples_lists);
          temp = {};
          for (_i = 0, _len = people_weights.length; _i < _len; _i++) {
            ps = people_weights[_i];
            temp[ps.person] = ps.weight;
          }
          for (_j = 0, _len1 = people.length; _j < _len1; _j++) {
            p = people[_j];
            if (temp[p]) {
              temp[p] += _this.INITIAL_PERSON_WEIGHT;
            } else {
              temp[p] = _this.INITIAL_PERSON_WEIGHT;
            }
          }
          return temp;
        };
      })(this)).then(function(recommendations) {
        var person, sorted_people, temp, ts, weight, weighted_people, _i, _len, _results;
        weighted_people = (function() {
          var _results;
          _results = [];
          for (person in recommendations) {
            weight = recommendations[person];
            _results.push([person, weight]);
          }
          return _results;
        })();
        sorted_people = weighted_people.sort(function(x, y) {
          return y[1] - x[1];
        });
        _results = [];
        for (_i = 0, _len = sorted_people.length; _i < _len; _i++) {
          ts = sorted_people[_i];
          _results.push(temp = {
            weight: ts[1],
            person: ts[0]
          });
        }
        return _results;
      });
    };

    GER.prototype.recommendations_for_person = function(person, action) {
      return this.ordered_similar_people(person).then((function(_this) {
        return function(people_weights) {
          var people, ps;
          people_weights = people_weights.slice(0, +_this.RESTRICTION_PEOPLE_LIST + 1 || 9e9);
          people_weights.push({
            weight: _this.INITIAL_PERSON_WEIGHT,
            person: person
          });
          people = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = people_weights.length; _i < _len; _i++) {
              ps = people_weights[_i];
              _results.push(ps.person);
            }
            return _results;
          })();
          return q.all([people_weights, _this.esm.things_people_have_actioned(action, people)]);
        };
      })(this)).spread((function(_this) {
        return function(people_weights, things) {
          things = things.slice(0, +_this.RESTRICTION_THINGS_LIST + 1 || 9e9);
          return _this.weighted_probabilities_to_action_things_by_people(things, action, people_weights);
        };
      })(this)).then(function(recommendations) {
        var ret, sorted_things, temp, thing, ts, weight, weight_things, _i, _len;
        weight_things = (function() {
          var _results;
          _results = [];
          for (thing in recommendations) {
            weight = recommendations[thing];
            _results.push([thing, weight]);
          }
          return _results;
        })();
        sorted_things = weight_things.sort(function(x, y) {
          return y[1] - x[1];
        });
        ret = [];
        for (_i = 0, _len = sorted_things.length; _i < _len; _i++) {
          ts = sorted_things[_i];
          temp = {
            weight: ts[1],
            thing: ts[0]
          };
          ret.push(temp);
        }
        return ret;
      });
    };

    GER.prototype.count_events = function() {
      return this.esm.count_events();
    };

    GER.prototype.event = function(person, action, thing, expires_at) {
      if (expires_at == null) {
        expires_at = null;
      }
      return this.esm.add_event(person, action, thing, expires_at).then(function() {
        return {
          person: person,
          action: action,
          thing: thing
        };
      });
    };

    GER.prototype.set_action_weight = function(action, weight) {
      return this.esm.set_action_weight(action, weight).then(function() {
        return {
          action: action,
          weight: weight
        };
      });
    };

    GER.prototype.get_action_weight = function(action) {
      return this.esm.get_action_weight(action);
    };

    GER.prototype.add_action = function(action) {
      return this.esm.add_action(action);
    };

    GER.prototype.bootstrap = function(stream) {
      return this.esm.bootstrap(stream);
    };

    GER.prototype.compact_database = function() {
      return q.all([this.esm.remove_expired_events(), this.esm.remove_non_unique_events(), this.esm.remove_superseded_events()]);
    };

    GER.prototype.compact_database_to_size = function(number_of_events) {
      return this.esm.remove_excessive_user_events().then((function(_this) {
        return function() {
          return _this.count_events();
        };
      })(this)).then((function(_this) {
        return function(count) {
          if (count <= number_of_events) {
            return count;
          } else {
            return _this.esm.remove_events_till_size(number_of_events);
          }
        };
      })(this));
    };

    return GER;

  })();

  RET = {};

  RET.GER = GER;

  knex = require('knex');

  RET.knex = knex;

  RET.PsqlESM = require('./lib/psql_esm');

  if (typeof define !== 'undefined' && define.amd) {
    define([], function() {
      return RET;
    });
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = RET;
  }

}).call(this);