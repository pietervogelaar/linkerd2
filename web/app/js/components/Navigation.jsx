import { daemonsetIcon, deploymentIcon, githubIcon, jobIcon, linkerdWordLogo, namespaceIcon, podIcon, replicaSetIcon, slackIcon, statefulSetIcon } from './util/SvgWrappers.jsx';
import AppBar from '@material-ui/core/AppBar';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Badge from '@material-ui/core/Badge';
import BreadcrumbHeader from './BreadcrumbHeader.jsx';
import Button from '@material-ui/core/Button';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import EmailIcon from '@material-ui/icons/Email';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import IconButton from '@material-ui/core/IconButton';
import LibraryBooksIcon from '@material-ui/icons/LibraryBooks';
import { Link } from 'react-router-dom';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import PropTypes from 'prop-types';
import React from 'react';
import ReactRouterPropTypes from 'react-router-prop-types';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Version from './Version.jsx';
import _maxBy from 'lodash/maxBy';
import classNames from 'classnames';
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import { faCloud } from '@fortawesome/free-solid-svg-icons/faCloud';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons/faExternalLinkAlt';
import { faFilter } from '@fortawesome/free-solid-svg-icons/faFilter';
import { faMicroscope } from '@fortawesome/free-solid-svg-icons/faMicroscope';
import { faRandom } from '@fortawesome/free-solid-svg-icons/faRandom';
import { faSmile } from '@fortawesome/free-regular-svg-icons/faSmile';
import { faStream } from '@fortawesome/free-solid-svg-icons/faStream';
import grey from '@material-ui/core/colors/grey';
import { processSingleResourceRollup } from './util/MetricUtils.jsx';
import { withContext } from './util/AppContext.jsx';
import { withStyles } from '@material-ui/core/styles';
import yellow from '@material-ui/core/colors/yellow';

const jsonFeedUrl = "https://linkerd.io/dashboard/index.json";
const localStorageKey = "linkerd-updates-last-clicked";
const minBrowserWidth = 960;

const styles = theme => {
  const drawerWidth = theme.spacing.unit * 36;
  const drawerWidthClosed = theme.spacing.unit * 9;
  const navLogoWidth = theme.spacing.unit * 22.5;
  const contentPadding = theme.spacing.unit * 3;

  const enteringFn = prop => theme.transitions.create(prop, {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  });
  const leavingFn = prop => theme.transitions.create(prop, {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  });

  const entering = enteringFn('width');
  const leaving = leavingFn('width');

  return {
    root: {
      display: 'flex',
    },
    appBar: {
      position: "absolute",
      color: 'white',
      transition: leaving,
    },
    appBarShift: {
      width: `calc(100% - ${drawerWidth}px)`,
      transition: entering,
    },
    drawer: {
      width: drawerWidth,
      transition: entering,
    },
    drawerClose: {
      width: drawerWidthClosed,
      transition: leaving,
    },
    drawerPaper: {
      overflowX: 'hidden',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: entering,
    },
    drawerPaperClose: {
      transition: leaving,
      width: drawerWidthClosed,
      [theme.breakpoints.up('sm')]: {
        width: drawerWidthClosed,
      },
    },
    toolbar: theme.mixins.toolbar,
    navToolbar: {
      display: 'flex',
      alignItems: 'center',
      padding: `0 0 0 ${theme.spacing.unit*2}px`,
      boxShadow: theme.shadows[4], // to match elevation == 4 on main AppBar
      ...theme.mixins.toolbar,
      backgroundColor: theme.palette.primary.main,
    },
    content: {
      flexGrow: 1,
      width: `calc(100% - ${drawerWidth}px)`,
      backgroundColor: theme.palette.background.default,
      padding: contentPadding,
      transition: entering,
    },
    contentDrawerClose: {
      width: `calc(100% - ${drawerWidthClosed}px)`,
      transition: leaving,
    },
    linkerdNavLogo: {
      minWidth: `${navLogoWidth}px`,
      transition: enteringFn(['margin', 'opacity']),
    },
    linkerdNavLogoClose: {
      opacity: "0",
      marginLeft: `-${navLogoWidth+theme.spacing.unit/2}px`,
      transition: leavingFn(['margin', 'opacity']),
    },
    namespaceChangeButton: {
      marginLeft: `${drawerWidth * .075}px`,
      marginTop: "11px",
      width: `${drawerWidth * .8}px`,
    },
    navMenuItem: {
      paddingLeft: `${contentPadding}px`,
      paddingRight: `${contentPadding}px`,
    },
    shrinkIcon: {
      fontSize: "19px",
      paddingLeft: "3px",
      paddingRight: "3px",
    },
    shrinkCloudIcon: {
      fontSize: "18px",
      paddingLeft: "1px",
    },
    // color is consistent with Octopus Graph coloring
    externalLinkIcon: {
      color: grey[500],
    },
    sidebarHeading: {
      color: grey[500],
      outline: "none",
      paddingTop: "9px",
      paddingBottom: "9px",
      marginLeft: `${drawerWidth * .09}px`,
    },
    toggleDrawerButton: {
      marginRight: `${contentPadding}px`,
    },
    badge: {
      backgroundColor: yellow[500],
    }
  };
};

class NavigationBase extends React.Component {
  constructor(props) {
    super(props);
    this.api = this.props.api;
    this.handleApiError = this.handleApiError.bind(this);
    this.handleConfirmNamespaceChange = this.handleConfirmNamespaceChange.bind(this);
    this.handleCommunityClick = this.handleCommunityClick.bind(this);
    this.handleDialogCancel = this.handleDialogCancel.bind(this);
    this.handleNamespaceMenuClick = this.handleNamespaceMenuClick.bind(this);
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);

    this.state = this.getInitialState();
    this.loadFromServer = this.loadFromServer.bind(this);
  }

  getInitialState() {
    return {
      anchorEl: null,
      drawerOpen: true,
      namespaceMenuOpen: false,
      hideUpdateBadge: true,
      latestVersion: '',
      isLatest: true,
      namespaces: [],
      pendingRequests: false,
      pollingInterval: 10000,
      loaded: false,
      error: null,
      showNamespaceChangeDialog: false,
    };
  }

  componentDidMount() {
    this.loadFromServer();
    this.timerId = window.setInterval(this.loadFromServer, this.state.pollingInterval);
    this.fetchVersion();
    this.fetchLatestCommunityUpdate();
    this.updateWindowDimensions();
    window.addEventListener("resize", this.updateWindowDimensions);
  }

  componentWillUpdate() {
    if (this.props.history) {
      this.props.checkNamespaceMatch(this.props.history.location.pathname);
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
    window.clearInterval(this.timerId);
    this.api.cancelCurrentRequests();
  }

  // API returns namespaces for namespace select button. No metrics returned.
  loadFromServer() {
    if (this.state.pendingRequests) {
      return;
    }
    this.setState({ pendingRequests: true });

    let apiRequests = [
      this.api.fetchMetrics(this.api.urlsForResourceNoStats("namespace"))
    ];

    this.api.setCurrentRequests(apiRequests);

    Promise.all(this.api.getCurrentPromises())
      .then(([allNs]) => {
        let namespaces = processSingleResourceRollup(allNs);
        this.setState({
          namespaces,
          pendingRequests: false,
          error: null
        });
      })
      .catch(this.handleApiError);
  }

  fetchVersion() {
    let versionUrl = `https://versioncheck.linkerd.io/version.json?version=${this.props.releaseVersion}&uuid=${this.props.uuid}&source=web`;
    this.versionPromise = fetch(versionUrl, { credentials: 'include' })
      .then(rsp => rsp.json())
      .then(versionRsp => {
        let latestVersion;
        let parts = this.props.releaseVersion.split("-", 2);
        if (parts.length === 2) {
          latestVersion = versionRsp[parts[0]];
        }
        this.setState({
          latestVersion,
          isLatest: latestVersion === this.props.releaseVersion
        });
      }).catch(this.handleApiError);
  }

  fetchLatestCommunityUpdate() {
    this.communityUpdatesPromise = fetch(jsonFeedUrl)
      .then(rsp => rsp.json())
      .then(rsp => rsp.data.date)
      .then(rsp => {
        if (rsp.length > 0) {
          let lastClicked = localStorage[localStorageKey];
          if (!lastClicked) {
            this.setState({ hideUpdateBadge: false });
          } else {
            let lastClickedDateObject = new Date(lastClicked);
            let latestArticle = _maxBy(rsp, update => update.date);
            let latestArticleDateObject = new Date(latestArticle);
            if (latestArticleDateObject > lastClickedDateObject) {
              this.setState({ hideUpdateBadge: false });
            }
          }
        }
      }).catch(this.handleApiError);
  }

  handleApiError(e) {
    this.setState({
      error: e
    });
  }

  handleCommunityClick = () => {
    let lastClicked = new Date();
    localStorage.setItem(localStorageKey, lastClicked);
    this.setState({ hideUpdateBadge: true });
  }

  handleDialogCancel = () => {
    this.setState({showNamespaceChangeDialog: false});
  }

  handleDrawerClick = () => {
    this.setState(state => ({ drawerOpen: !state.drawerOpen }));
  };

  handleConfirmNamespaceChange = () => {
    this.setState({showNamespaceChangeDialog: false});
    this.props.updateNamespaceInContext(this.state.newNamespace);
    this.props.history.push(`/namespaces/${this.state.newNamespace}`);
  }

  handleNamespaceChange = namespace => {
    this.setState({ namespaceMenuOpen: false });
    if (namespace === this.props.selectedNamespace) {
      return;
    }
    let path = this.props.history.location.pathname;
    let pathParts = path.split("/");
    if (pathParts.length === 3 || pathParts.length === 4) {
      // path is /namespaces/someNamespace/resourceType
      //      or /namespaces/someNamespace
      path = path.replace(this.props.selectedNamespace, namespace);
      this.props.history.push(path);
      this.props.updateNamespaceInContext(namespace);
    } else if (pathParts.length === 5) {
      // path is /namespace/someNamespace/resourceType/someResource
      this.setState({ showNamespaceChangeDialog: true,
        newNamespace: namespace });
    } else {
      // update the selectedNamespace in context with no path changes
      this.props.updateNamespaceInContext(namespace);
    }
  }

  handleNamespaceMenuClick = event => {
    this.setState({ anchorEl: event.currentTarget });
    this.setState(state => ({ namespaceMenuOpen: !state.namespaceMenuOpen }));
  }

  menuItem(path, title, icon, onClick) {
    const { classes, api } = this.props;
    let normalizedPath = this.props.location.pathname.replace(this.props.pathPrefix, "");
    let isCurrentPage = path => path === normalizedPath;

    return (
      <MenuItem
        component={Link}
        onClick={onClick}
        id={`${title.toLowerCase()}-button`}
        to={api.prefixLink(path)}
        className={classes.navMenuItem}
        selected={isCurrentPage(path)}>
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={title} />
      </MenuItem>
    );
  }

  updateWindowDimensions() {
    let browserWidth = window.innerWidth;
    if (browserWidth < minBrowserWidth) {
      this.setState({ drawerOpen: false });
    } else {
      this.setState({ drawerOpen: true });
    }
  }

  render() {
    const { api, classes, selectedNamespace, ChildComponent, ...otherProps } = this.props;
    const { namespaces, anchorEl, drawerOpen, showNamespaceChangeDialog, newNamespace } = this.state;
    let formattedNamespaceName = selectedNamespace;
    if (formattedNamespaceName === "_all") {
      formattedNamespaceName = "All Namespaces";
    }

    return (
      <div className={classes.root}>
        <AppBar
          className={classNames(classes.appBar, {[classes.appBarShift]: drawerOpen} )}>
          <Toolbar id="toolbar">
            <Typography variant="h6" color="inherit" noWrap>
              { !drawerOpen &&
              <IconButton className={classes.toggleDrawerButton}>
                <FontAwesomeIcon icon={faBars} onClick={this.handleDrawerClick} />
              </IconButton>
              }
              <BreadcrumbHeader {...this.props} />
            </Typography>
          </Toolbar>
        </AppBar>

        <Drawer
          className={classNames(classes.drawer, {[classes.drawerClose]: !drawerOpen} )}
          variant="persistent"
          classes={{
            paper: classNames(classes.drawerPaper, {[classes.drawerPaperClose]: !drawerOpen} ),
          }}
          open={drawerOpen}>
          <div className={classNames(classes.navToolbar)}>
            <div className={classNames(classes.linkerdNavLogo, {[classes.linkerdNavLogoClose]: !drawerOpen} )}>
              <Link to="/namespaces">{linkerdWordLogo}</Link>
            </div>
            <IconButton className="drawer-toggle-btn" onClick={this.handleDrawerClick}>
              <ChevronLeftIcon />
            </IconButton>
          </div>

          <Divider />
          <MenuList>
            <Typography variant="button" className={classes.sidebarHeading}>
                Cluster
            </Typography>

            { this.menuItem("/namespaces", "Namespaces", namespaceIcon) }


            { this.menuItem("/controlplane", "Control Plane",
              <FontAwesomeIcon icon={faCloud} className={classes.shrinkCloudIcon} />) }

          </MenuList>

          <Divider />

          <MenuList>
            <Button
              id="namespace-selection-button"
              variant="contained"
              className={classes.namespaceChangeButton}
              size="large"
              onClick={this.handleNamespaceMenuClick}>
              { formattedNamespaceName }
              <ArrowDropDownIcon />
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={this.state.namespaceMenuOpen}
              keepMounted
              onClose={this.handleNamespaceMenuClick}>
              <MenuItem
                value="all"
                id="_all-namespace-option"
                onClick={() => this.handleNamespaceChange("_all")}>
                  All Namespaces
              </MenuItem>

              <Divider />

              {namespaces.map(ns => (
                <MenuItem
                  id={`${ns.name}-namespace-option`}
                  onClick={() => this.handleNamespaceChange(ns.name)}
                  key={ns.name}>
                  {ns.name}
                </MenuItem>
              ))}
            </Menu>
            <Dialog
              open={showNamespaceChangeDialog}
              onClose={this.handleClose}
              aria-labelledby="form-dialog-title">
              <DialogTitle id="form-dialog-title">
                Change namespace?
              </DialogTitle>
              <DialogContent>
                <DialogContentText>
              The resource you are viewing is in a different namespace than the namespace you have selected. Do you want to change the namespace from { selectedNamespace } to { newNamespace }?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button id="confirm-namespace-change" onClick={this.handleConfirmNamespaceChange} color="primary">
                    Yes
                </Button>
                <Button id="cancel-namespace-change" onClick={this.handleDialogCancel} variant="text">
                  No
                </Button>
              </DialogActions>
            </Dialog>
          </MenuList>

          <MenuList>
            <Typography variant="button" className={classes.sidebarHeading}>
                Workloads
            </Typography>

            { this.menuItem(`/namespaces/${selectedNamespace}/daemonsets`, "Daemon Sets", daemonsetIcon) }

            { this.menuItem(`/namespaces/${selectedNamespace}/deployments`, "Deployments", deploymentIcon) }

            { this.menuItem(`/namespaces/${selectedNamespace}/jobs`, "Jobs", jobIcon) }

            { this.menuItem(`/namespaces/${selectedNamespace}/pods`, "Pods", podIcon) }

            { this.menuItem(`/namespaces/${selectedNamespace}/replicationcontrollers`, "Replication Controllers", replicaSetIcon) }

            { this.menuItem(`/namespaces/${selectedNamespace}/statefulsets`, "Stateful Sets", statefulSetIcon) }
          </MenuList>

          <MenuList>
            <Typography variant="button" className={classes.sidebarHeading}>
                Configuration
            </Typography>

            { this.menuItem(`/namespaces/${selectedNamespace}/trafficsplits`, "Traffic Splits", <FontAwesomeIcon icon={faFilter} className={classes.shrinkIcon} />) }

          </MenuList>
          <Divider />
          <MenuList >
            <Typography variant="button" className={classes.sidebarHeading}>
                Tools
            </Typography>

            { this.menuItem("/tap", "Tap", <FontAwesomeIcon icon={faMicroscope} className={classes.shrinkIcon} />) }
            { this.menuItem("/top", "Top", <FontAwesomeIcon icon={faStream} className={classes.shrinkIcon} />) }
            { this.menuItem("/routes", "Routes", <FontAwesomeIcon icon={faRandom} className={classes.shrinkIcon} />) }

          </MenuList>
          <Divider />
          <MenuList>
            { this.menuItem("/community", "Community",
              <Badge
                classes={{ badge: classes.badge }}
                invisible={this.state.hideUpdateBadge}
                badgeContent="1">
                <FontAwesomeIcon icon={faSmile} className={classes.shrinkIcon} />
              </Badge>, this.handleCommunityClick
              ) }

            <MenuItem component="a" href="https://linkerd.io/2/overview/" target="_blank" className={classes.navMenuItem}>
              <ListItemIcon><LibraryBooksIcon className={classes.shrinkIcon} /></ListItemIcon>
              <ListItemText primary="Documentation" />
              <FontAwesomeIcon icon={faExternalLinkAlt} className={classes.externalLinkIcon} size="xs" />
            </MenuItem>

            <MenuItem component="a" href="https://github.com/linkerd/linkerd2/issues/new/choose" target="_blank" className={classes.navMenuItem}>
              <ListItemIcon>{githubIcon}</ListItemIcon>
              <ListItemText primary="GitHub" />
              <FontAwesomeIcon icon={faExternalLinkAlt} className={classes.externalLinkIcon} size="xs" />
            </MenuItem>

            <MenuItem component="a" href="https://lists.cncf.io/g/cncf-linkerd-users" target="_blank" className={classes.navMenuItem}>
              <ListItemIcon><EmailIcon className={classes.shrinkIcon} /></ListItemIcon>
              <ListItemText primary="Mailing List" />
              <FontAwesomeIcon icon={faExternalLinkAlt} className={classes.externalLinkIcon} size="xs" />
            </MenuItem>

            <MenuItem component="a" href="https://slack.linkerd.io" target="_blank" className={classes.navMenuItem}>
              <ListItemIcon>{slackIcon}</ListItemIcon>
              <ListItemText primary="Slack" />
              <FontAwesomeIcon icon={faExternalLinkAlt} className={classes.externalLinkIcon} size="xs" />
            </MenuItem>

          </MenuList>

          {
            !drawerOpen ? null : <Version
              isLatest={this.state.isLatest}
              latestVersion={this.state.latestVersion}
              releaseVersion={this.props.releaseVersion}
              error={this.state.error}
              uuid={this.props.uuid} />
          }
        </Drawer>

        <main className={classNames(classes.content, {[classes.contentDrawerClose]: !drawerOpen})}>
          <div className={classes.toolbar} />
          <div className="main-content"><ChildComponent {...otherProps} /></div>
        </main>
      </div>
    );
  }
}

NavigationBase.propTypes = {
  api: PropTypes.shape({}).isRequired,
  ChildComponent: PropTypes.func.isRequired,
  classes: PropTypes.shape({}).isRequired,
  location: ReactRouterPropTypes.location.isRequired,
  pathPrefix: PropTypes.string.isRequired,
  releaseVersion: PropTypes.string.isRequired,
  theme: PropTypes.shape({}).isRequired,
  uuid: PropTypes.string.isRequired,
};

export default withContext(withStyles(styles, { withTheme: true })(NavigationBase));
