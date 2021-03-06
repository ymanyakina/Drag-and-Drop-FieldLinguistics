//TODO this is mostly a copy of DataListView, we will need to think about what actually needs to go in here and what it will look like.
define( [ 
    "use!backbone", 
    "use!handlebars",
    "text!data_list/new_data_list.handlebars",
    "text!datum/paging_footer.handlebars",
    "data_list/DataList",
    "datum/Datum",
    "datum/DatumLatexView",
    "datum/Datums"
], function(
    Backbone, 
    Handlebars, 
    new_data_listTemplate,
    pagingFooterTemplate,
    DataList, 
    Datum, 
    DatumLatexView,
    Datums  
) {
  var NewDataListView = Backbone.View.extend(
  /** @lends NewDataList.prototype */
  {
    /**
     * TODO Update description
     * @class  This is a page where the user can create their own assorted datalist.  They can pick examples from the DataListView and then drag them over to their own customized data list.
     * @extends Backbone.View
     * @constructs
     */
    initialize : function() {
      Utils.debug("DATALIST init: " + this.el);

      this.model.bind("change:title change:dateCreated change:description",
          this.renderUpdatedDataList, this);
    },

    /**
     * The underlying model of the DataListView is a DataList.
     */
    model : DataList,

    /** 
     * The datumLatexViews array holds all the children of the
     * DataListView.
     */
    datumLatexViews : [],

    /**
     * Events that the DataListView is listening to and their handlers.
     */
    events : {
      'click a.servernext' : 'nextResultPage',
      'click .serverhowmany a' : 'changeCount'
    },

    /**
     * The Handlebars template rendered as the NewDataListView.
     */
    template : Handlebars.compile(new_data_listTemplate),

    /**
     * The Handlebars template of the pagination footer, which is used
     * as a partial.
     */
    footerTemplate : Handlebars.compile(pagingFooterTemplate),

    /**
     * Initially renders the DataListView. This should only be called by 
     * this.initialize. To update the current rendering, use renderUpdate()
     * instead.
     */
    render : function() {
      Utils.debug("DATALIST render: " + this.el);
      if (this.model != undefined) {
        // Display the Data List
        this.setElement($("#new_data_list"));
        $(this.el).html(this.template(this.model.toJSON()));

        // Display the pagination footer
        this.renderUpdatedPagination();

        // TODO Display the first page of DatumLatexViews.
        // this.renderNewModel();
      } else {
        Utils.debug("\tDataList model is not defined");
      }

      return this;
    },

    /**
     * Re-renders the datalist header based on the current model.
     */
    renderUpdatedDataList : function() {
      $(".title").text(this.model.get("title"));
      $(".dateCreated").text(this.model.get("dateCreated"));
      $(".description").text(this.model.get("description"));
    },

    /**
     * Re-renders the datums based on the current model.
     * Re-renders the pagination footer based on the current pagination data.
     * 
     * This should be called whenever the model is replaced (i.e. when you open
     * a new DataList or perform a new Search).
     */
    renderNewModel : function() {
      // Remove all the DatumLatexViews that are currently being displayed
      while (this.datumLatexViews.length > 0) {
        var datumLatexView = this.datumLatexViews.pop();
        datumLatexView.remove();
      }

      // Display the first page of Datum and the pagination footer
      for (i = 0; i < this.perPage; i++) {
        var datumId = this.model.get("datumIds")[i];
        if (datumId) {
          this.addOne(datumId);
        }
      }
    },

    /**
     * Re-calculates the pagination values and re-renders the pagination footer.
     */
    renderUpdatedPagination : function() {
      // Replace the old pagination footer
      $("#data_list_footer")
          .html(this.footerTemplate(this.getPaginationInfo()));
    },

    /**
     * For paging, the number of items per page.
     */
    perPage : 3,

    /**
     * Based on the number of items per page and the current page, calculate the current
     * pagination info.
     * 
     * @return {Object} JSON to be sent to the footerTemplate.
     */
    getPaginationInfo : function() {
      var currentPage = (this.datumLatexViews.length > 0) ? Math
          .ceil(this.datumLatexViews.length / this.perPage) : 1;
      var totalPages = (this.datumLatexViews.length > 0) ? Math.ceil(this.model
          .get("datumIds").length
          / this.perPage) : 1;

      return {
        currentPage : currentPage,
        totalPages : totalPages,
        perPage : this.perPage,
        morePages : currentPage < totalPages
      };
    },

    /**
     * Displays a new DatumLatexView for the Datum with the given datumId
     * and updates the pagination footer.
     * 
     * @param {String} datumId The datumId of the Datum to display.
     */
    addOne : function(datumId) {
      // Get the corresponding Datum from PouchDB 
      var d = new Datum();
      d.id = datumId;
      var self = this;
      d.fetch({
        success : function() {
          // Restructure Datum's inner models
          d.restructure();
          
          // Render a DatumLatexView for that Datum at the end of the DataListView
          var view = new DatumLatexView({
            model : d
          });
          $('#data_list_content').append(view.render().el);

          // Keep track of the DatumLatexView
          self.datumLatexViews.push(view);

          // Display the updated DatumLatexView
          self.renderUpdatedPagination();
        },

        error : function() {
          Utils.debug("Error fetching datum: " + datumId);
        }
      });
    },

    /**
     * Change the number of items per page.
     * 
     * @param {Object} e The event that triggered this method.
     */
    changeCount : function(e) {
      e.preventDefault();

      // Change the number of items per page
      this.perPage = parseInt($(e.target).text());
    },

    /**
     * Add one page worth of DatumLatexViews from the DataList.
     * 
     * @param {Object} e The event that triggered this method.
     */
    nextResultPage : function(e) {
      e.preventDefault();

      // Determine the range of indexes into the model's datumIds array that are 
      // on the page to be displayed
      var startIndex = this.datumLatexViews.length;
      var endIndex = startIndex + this.perPage;

      // Add a DatumLatexView for each one
      for (i = startIndex; i < endIndex; i++) {
        var datumId = this.model.get("datumIds")[i];
        if (datumId) {
          this.addOne(datumId);
        }
      }
    }
  });

  return NewDataListView;
});