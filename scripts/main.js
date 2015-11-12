var React = require('react');
var ReactDom = require('react-dom');

var Catalyst = require('react-catalyst');
var $ = require('jquery');

var containsSearch = function(word, tokens){
  for(var j=0; j < tokens.length; j++){
    if (word.indexOf(tokens[j].trim()) === -1){
      return false;
    }
  }
  return true;
}

var toMMSS = function (seconds) {
  var minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  if (seconds < 10) {seconds = '0' + seconds;}
  return minutes + ':' + seconds;
}

/*
 * App
*/
var App = React.createClass({
  mixins: [Catalyst.LinkedStateMixin],
  changeGender: function(event){
    this.setState({
      courseGender: event.target.value,
      selectedCourse: '',
      compareCourse: ''
    })
  },
  setTime: function(minutes, seconds){
    this.state.time = 60 * parseInt(minutes) + parseInt(seconds);
    this.setState({time: this.state.time});
  },
  selectCourse: function(course){
    this.state.selectedCourse = course;
    this.setState({selectedCourse: course});
    this.getCompareFactor();
  },
  setCompareCourse: function(course){
    this.state.compareCourse = course;
    this.setState({compareCourse: course});
    this.getCompareFactor();
  },
  getCompareFactor: function(){
    var validCourses = this.state.courses[this.state.courseGender];
    if(validCourses.indexOf(this.state.compareCourse) !== -1 &&
      validCourses.indexOf(this.state.selectedCourse) !== -1){
      $.get('/api/compare/' +
        this.state.courseGender + '/' +
        this.state.compareCourse + '/' +
        this.state.selectedCourse, function(data){
          this.setState({
            courseFactor: data.factor
          })
        }.bind(this));
    }
  },
  getInitialState: function(){
    return {
      courses: {female: [], male: []},
      selectedCourse: '',
      compareCourse: '',
      time: 1600,
      courseGender: 'male',
      courseFactor: 1
    }
  },
  componentDidMount: function(){
    $.get('/api/courses', function(data){
      if (this.isMounted()) {
        this.setState({
          courses: data
        })
      }
    }.bind(this));
  },
  render: function(){
    return (
      <div className='container'>
        <Header />
        <CourseInput courses={this.state.courses} linkState={this.linkState} 
          changeGender={this.changeGender}
          selectCourse={this.selectCourse} 
          setCompareCourse={this.setCompareCourse}
          compareCourse={this.state.compareCourse}
          courseGender={this.state.courseGender} 
          setTime={this.setTime}
          selectedCourse={this.state.selectedCourse}/>
        <CourseComparison selectedCourse={this.state.selectedCourse}
        compareCourse={this.state.compareCourse}
        time={this.state.time}
        projTime={Math.round(this.state.courseFactor * this.state.time)}
        courses={this.state.courses} />
        <hr/>
        <Explanation />
      </div>
  )}
});

/*
 * Header
*/
var Header = React.createClass({
  render: function(){
    return(
      <h1>Course Compare</h1>
    )}
})

/*
 * Course Input
*/
var CourseInput = React.createClass({
  getInitialState: function(){
    return {
    }
  },
  setTime: function(event){
    this.props.setTime(this.refs.minutes.value, this.refs.seconds.value);
  },
  render: function(){
    var linkState = this.props.linkState;
    return(
      <form ref='courseForm'>
          <label>Gender: </label>
        <div className='form-inline'>
          <select className='form-control' onChange={this.props.changeGender}>
            <option value='male'>Men</option>
            <option value='female'>Women</option>
          </select>
        </div>

        <label>Course</label>
        <input type='text' className='form-control' 
          valueLink={linkState('selectedCourse')} 
          placeholder='Begin typing to see available courses'/>
        <CourseList clickFunc={this.props.selectCourse} 
          search={this.props.selectedCourse} courses={this.props.courses} 
          gender={this.props.courseGender}/>

        <label>Time</label>

        <span className='time-entry' 
          onChange={this.setTime}>
            <input type='number' min={0} maxLength={3} ref='minutes' 
            className='form-control minutes' defaultValue={26} />
            :
            <input type='number' min={0} max={59} ref='seconds'
            className='form-control seconds' defaultValue={40} />
        </span>

        <label>Compare To</label>
        <input type='text' className='form-control' 
          placeholder='Begin typing to see available courses'
          valueLink={linkState('compareCourse')}/>
        <CourseList selectCourse={this.props.selectCourse} 
          search={this.props.compareCourse} courses={this.props.courses} 
          gender={this.props.courseGender} 
          clickFunc={this.props.setCompareCourse}/>
      </form>
    )}
})

var CourseList = React.createClass({
  filterCourses: function(){
    var search= this.props.search,
      courses = this.props.courses[this.props.gender];

    if (search.trim() === '' || courses.indexOf(search) !== -1){
      return [];
    } else {
      var tokens = search.toLowerCase().split(' ');
      return courses.filter(function(d){
        return containsSearch(d.toLowerCase(), tokens)
      })
    }
  },
  renderCourse: function(key) {
    return (
      <li key={key}>
        <button className='selectCourse btn btn-primary' 
        onClick={this.props.clickFunc.bind(null, key)}>{key}
        </button>
      </li>
    )
  },
  render: function(){
    return(
    <ul className='selectCourse'>
      {this.filterCourses().slice(0, 5).map(this.renderCourse)}
    </ul>
    )}
})

/*
 * CourseComparison
 */

var CourseComparison = React.createClass({
  compareCourses: function(){
    var courses = this.props.courses[this.props.gender];
  },
  render: function(){
    return(
      <table className='table table-striped table-bordered'>
        <thead>
          <tr>
            <th>Course</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{this.props.selectedCourse}</td>
            <td>{toMMSS(this.props.time)} (actual)</td>
          </tr>
          <tr>
            <td>{this.props.compareCourse}</td>
            <td>{toMMSS(this.props.projTime)} (projected)</td>
          </tr>
        </tbody>
      </table>
    )
  }
})

/*
 * Explanation
 */
var Explanation = React.createClass({
  render: function() {
    return(
      <div className='row'>
        <h2>What's going on here?</h2>
        <p>We collected hundreds of thousands of cross country results while building <a href='http://colcarroll.github.io/xc_predictions/' target='_blank'>this project</a>,
          and along the way needed to be able to normalize times on different courses.
          In order to do this, we calculate a conversion factor between every two courses:
          that is, for courses <it>i</it> and <it>j</it>,
          there should be a number <it>x<sub>i,j</sub></it> so that if you know a runner's time on course <it>i</it> is <it>t<sub>i</sub></it>,
          then <it>t<sub>i</sub> * x<sub>i,j</sub></it> ~ <it>t<sub>j</sub></it>.</p>
      <p>When there are enough runners that have run on the same two courses,
      the conversion factor will be the <em>median</em> of the ratio between the two courses.
      This creates a graph whose nodes are courses and whose edges are the comparisons we already have.
      We add more edges to the graph by doing a pseudo-matrix multiplication:
      for two nodes that are <it>n</it> steps apart, the conversion factor will be the geometric mean
      over all paths of length <it>n</it> between the nodes 
      (the geometric mean is used, since it preserves the relationship <it>x<sub>i,j</sub> * x<sub>j,i</sub> = 1</it>).
      </p>
      <p>This second step will finish the comparisons if the course graph is connected (in practice, it isn't,
      presumably because there are high school results in the data set).  For any courses still lacking a 
      comparison, the naive approach is used, where the conversion ratio is the ratio of the median of 
      all times run on each course.  Because of this step, conversion factors are computed separately for
        men's and women's races.</p>
      </div>
    )
  }
})
ReactDom.render(<App />, document.querySelector('#main'))
