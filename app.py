import os
from flask import Flask, make_response, jsonify

from courses import CourseHandicapper
DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder='build')


def build():
    genders = ('male', 'female')
    handicappers = {gender: CourseHandicapper(gender) for gender in genders}
    for handicapper in handicappers.values():
        handicapper.handicaps
    return handicappers

handicappers = build()


@app.route('/')
def index():
    return make_response(open(os.path.join(DIR, 'index.html')).read())


@app.route('/api/courses')
def courses():
    return jsonify({key: value.courses for key, value in handicappers.iteritems()})


@app.route('/api/compare/<gender>/<course_one>/<course_two>')
def compare(gender, course_one, course_two):
    return jsonify({'factor': handicappers[gender].compare(course_one, course_two)})


if __name__ == '__main__':
    app.run()
